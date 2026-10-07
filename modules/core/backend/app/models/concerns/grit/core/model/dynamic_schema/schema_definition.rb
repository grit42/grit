#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

# A schema definition owns one PostgreSQL schema holding its tables.
#
#   - Draft: objects are named after ids (`<prefix>_<id>`, `t<id>`, `c<id>`),
#     which are never valid identifiers, so identifier changes run no DDL.
#     Other structural changes apply immediately. `record_klass` is unavailable.
#   - Committed: `commit!` renames everything to its identifier in one
#     transaction and locks the structure; `revert_to_draft!` renames it back.
#     Data is kept both ways.
#
# Includers need a `committed_at` datetime column (nil while a draft).
module Grit::Core::Model::DynamicSchema::SchemaDefinition
  extend ActiveSupport::Concern
  include Grit::Core::Model::DynamicSchema::ValidIdentifier
  include Grit::Core::Model::DynamicSchema::Refusal

  MAX_IDENTIFIER_LENGTH = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
  IDENTIFIER_FORMAT = Grit::Core::Model::DynamicSchema::ValidIdentifier::IDENTIFIER_FORMAT

  # `<prefix>_<identifier>` must fit PostgreSQL's 63-byte identifier limit.
  MAX_SCHEMA_PREFIX_LENGTH = 63 - (1 + MAX_IDENTIFIER_LENGTH)

  # Schemas PostgreSQL or grit's static tables own; `pg_*` is reserved wholesale.
  RESERVED_SCHEMA_NAMES = %w[public information_schema].freeze
  RESERVED_SCHEMA_NAME_PREFIX = "pg_"

  # The prefixes in `config.grit.dynamic_schema_prefixes`, which the engine
  # excludes from `structure.sql` (see `ExcludeDynamicSchemasFromStructureDump`).
  def self.schema_prefixes
    Grit::Core::Engine.config.grit.dynamic_schema_prefixes.map do |prefix|
      prefix = prefix.to_s
      check_schema_prefix!(prefix)
      prefix
    end
  end

  def self.check_schema_prefix!(prefix)
    raise ArgumentError, "Dynamic schema prefix #{prefix.inspect} should start with two lowercase letters or underscores and contain only lowercase letters, numbers and underscores" unless IDENTIFIER_FORMAT.match?(prefix)
    raise ArgumentError, "Dynamic schema prefix #{prefix.inspect} is #{prefix.bytesize} bytes; at most #{MAX_SCHEMA_PREFIX_LENGTH}, so that a #{prefix}_<schema> schema name survives PostgreSQL's 63 byte limit" if prefix.bytesize > MAX_SCHEMA_PREFIX_LENGTH
  end

  # Validates `self.schema_prefix =` like the macro, including that the prefix is
  # declared in config. Prepended because `class_attribute` defines the writer
  # on the singleton class.
  module SchemaPrefixWriter
    def schema_prefix=(prefix)
      return super if prefix.nil?
      prefix = prefix.to_s
      Grit::Core::Model::DynamicSchema::SchemaDefinition.check_schema_prefix!(prefix)
      unless Grit::Core::Model::DynamicSchema::SchemaDefinition.schema_prefixes.include?(prefix)
        raise ArgumentError, "Dynamic schema prefix #{prefix.inspect} is not declared; add it to config.grit.dynamic_schema_prefixes in the engine or app that defines #{name}"
      end
      super(prefix)
    end
  end

  included do
    class_attribute :table_definitions_association, default: nil
    class_attribute :schema_prefix, default: nil, instance_writer: false
    singleton_class.prepend(SchemaPrefixWriter)

    # Run inside the transaction; for objects that depend on physical names,
    # such as views. Throwing :abort in a `before_` callback cancels the change.
    define_model_callbacks :schema_commit, :schema_revert, :schema_drop

    # Guards; see `Refusal`.
    validate :refuse_unless_can_modify, except_on: :schema_commit, prepend: true
    validate :schema_prefix_declared
    validate :schema_name_available
    validate :check_identifier_modifiable, if: -> { persisted? && identifier_changed? }

    after_create :create_schema

    # Declared before `has_many_table_definitions`' `dependent: :destroy`, so
    # `before_schema_drop` still sees the table definitions.
    before_destroy :refuse_unless_can_modify
    before_destroy :drop_schema
  end

  def committed?
    committed_at.present?
  end

  def draft_schema_name
    "#{self.schema_prefix}_#{id}"
  end

  def committed_schema_name
    "#{self.schema_prefix}_#{identifier}"
  end

  # The current physical name.
  def schema_name
    committed? ? committed_schema_name : draft_schema_name
  end

  def schema_exists?
    ActiveRecord::Base.connection.schema_exists?(schema_name)
  end

  def quoted_schema_name
    ActiveRecord::Base.connection.quote_schema_name(schema_name)
  end

  def table_definitions
    association(self.table_definitions_association).reader
  end

  # A fresh copy of this row, locked FOR UPDATE (nil if gone). Structural
  # changes read the committed state from it, so they serialise with commits.
  # A copy because `lock!` refuses records with unsaved changes.
  def locked_copy
    self.class.base_class.unscoped.lock.find_by(id: id)
  end

  def schema_prefix_declared
    return if self.schema_prefix.present?
    errors.add(:base, "#{self.class.name} must declare a dynamic_schema_prefix")
  end

  # Against siblings only; `commit!` checks the catalog.
  def schema_name_available
    return if identifier.blank?
    return if self.schema_prefix.blank?
    name = committed_schema_name
    if RESERVED_SCHEMA_NAMES.include?(name) || name.start_with?(RESERVED_SCHEMA_NAME_PREFIX)
      errors.add(:identifier, "would resolve to #{name}, a schema name PostgreSQL reserves")
    elsif sibling_resolves_to_schema?(name)
      errors.add(:identifier, "is already taken: another definition resolves to the schema #{name}")
    end
  end

  def sibling_resolves_to_schema?(name)
    scope = self.class.base_class.unscoped.where(identifier: identifier)
    scope = scope.where.not(id: id) if persisted?
    scope.any? { |sibling| sibling.committed_schema_name == name }
  end

  def check_identifier_modifiable
    locked = locked_copy
    return unless locked&.committed?
    errors.add(:identifier, "cannot be changed while #{locked.committed_schema_name} is committed; revert it to draft first")
    throw :abort
  end

  # No `if_not_exists`: a schema already under this id-based name isn't ours.
  def create_schema
    ActiveRecord::Base.connection.create_schema(draft_schema_name)
  end

  # Named from the locked row: the identifier in memory may be a refused one,
  # and the drop cascades.
  def drop_schema
    locked = locked_copy
    return if locked.nil?
    count = errors.count
    dropped = run_callbacks(:schema_drop) do
      ActiveRecord::Base.connection.drop_schema(locked.schema_name, if_exists: true)
      true
    end
    return if dropped
    errors.add(:base, "A before_schema_drop callback aborted the drop") if errors.count == count
    throw :abort
  end

  def commit
    commit!
    true
  rescue Grit::Core::Model::DynamicSchema::CommitError => e
    e.messages.each { |message| errors.add(:base, message) }
    false
  end

  # Renames the draft to readable names in one transaction, after validating
  # every definition. Raises one CommitError listing every problem.
  def commit!
    in_schema_transaction do
      raise Grit::Core::Model::DynamicSchema::CommitError, "#{committed_schema_name} is already committed" if committed?
      tables = table_definitions.includes(table_definitions.klass.column_definitions_association => :data_type).to_a
      messages = commit_errors(tables)
      raise Grit::Core::Model::DynamicSchema::CommitError, messages if messages.any?

      run_schema_callbacks(:schema_commit) do
        translating_statement_errors("commit #{committed_schema_name}") do
          ActiveRecord::Base.connection.rename_schema(draft_schema_name, committed_schema_name)
          tables.each { |table| table.rename_physical_objects!(committed_schema_name, to: :committed) }
        end
        update_columns(committed_at: Time.current)
      end
    end
  end

  def revert_to_draft
    revert_to_draft!
    true
  rescue Grit::Core::Model::DynamicSchema::CommitError => e
    e.messages.each { |message| errors.add(:base, message) }
    false
  end

  # The inverse of `commit!`.
  def revert_to_draft!
    in_schema_transaction do
      raise Grit::Core::Model::DynamicSchema::CommitError, "#{draft_schema_name} is not committed" unless committed?
      if ActiveRecord::Base.connection.schema_exists?(draft_schema_name)
        raise Grit::Core::Model::DynamicSchema::CommitError, "Could not revert #{committed_schema_name} to draft: the schema #{draft_schema_name} already exists"
      end
      tables = table_definitions.includes(table_definitions.klass.column_definitions_association => :data_type).to_a

      run_schema_callbacks(:schema_revert) do
        translating_statement_errors("revert #{committed_schema_name} to draft") do
          tables.each { |table| table.rename_physical_objects!(committed_schema_name, to: :draft) }
          ActiveRecord::Base.connection.rename_schema(committed_schema_name, draft_schema_name)
        end
        update_columns(committed_at: nil)
      end
    end
  end

  private

  # A savepoint, so a failed non-bang call rolls back inside a caller's
  # transaction. Restores `committed_at` in memory on failure, since a rollback
  # doesn't. `check_can_modify` sees the locked row.
  def in_schema_transaction
    if new_record? || has_changes_to_save?
      raise Grit::Core::Model::DynamicSchema::CommitError, "Save #{self.class.model_name.human.downcase} #{identifier} before committing or reverting it"
    end
    committed_at_before = committed_at
    self.class.transaction(requires_new: true) do
      lock!
      committed_at_before = committed_at
      check_can_modify!
      yield
    end
    self
  rescue StandardError
    self.committed_at = committed_at_before
    clear_attribute_changes([ :committed_at ])
    raise
  end

  # Cleared after, as the non-bang forms copy the messages back onto `errors`.
  def check_can_modify!
    errors.clear
    refused = !catch(:abort) do
      refuse_unless_can_modify
      true
    end
    return unless refused
    messages = errors.full_messages.map { |message| "Schema #{identifier}: #{message}" }
    errors.clear
    raise Grit::Core::Model::DynamicSchema::CommitError, messages
  end

  def run_schema_callbacks(kind, &block)
    completed = run_callbacks(kind) do
      block.call
      true
    end
    raise Grit::Core::Model::DynamicSchema::CommitError, "A before_#{kind} callback aborted the change" unless completed
  end

  def translating_statement_errors(action)
    yield
  rescue ActiveRecord::StatementInvalid => e
    raise Grit::Core::Model::DynamicSchema::CommitError, "Could not #{action}: #{e.message.lines.first.to_s.strip}"
  end

  # Every definition's errors, plus whether the readable schema name is taken.
  # `check_can_modify` is the schema's alone; see `check_can_modify!`.
  def commit_errors(tables)
    messages = definition_errors(self, "Schema #{identifier}")
    if ActiveRecord::Base.connection.schema_exists?(committed_schema_name)
      messages.push("Schema #{identifier}: the schema #{committed_schema_name} already exists")
    end
    tables.each do |table|
      messages.concat(definition_errors(table, "Table #{table.identifier}"))
      table.column_definitions.each do |column|
        messages.concat(definition_errors(column, "Column #{table.identifier}.#{column.identifier}"))
      end
    end
    messages
  end

  def definition_errors(definition, label)
    return [] if definition.valid?(Grit::Core::Model::DynamicSchema::Refusal::COMMIT_VALIDATION_CONTEXT)
    definition.errors.full_messages.map { |message| "#{label}: #{message}" }
  end

  class_methods do
    def dynamic_schema_prefix(prefix)
      self.schema_prefix = prefix
    end

    # `dependent: :destroy`, so includers' table callbacks run; the concern's own
    # guard, draft check and DROP TABLE are skipped, as DROP SCHEMA ... CASCADE
    # takes the tables. Reset first, as the cascade destroys the target as
    # loaded, which may predate tables added since.
    def has_many_table_definitions(table_definitions_association)
      before_destroy { association(table_definitions_association).reset }
      has_many table_definitions_association, dependent: :destroy
      self.table_definitions_association = table_definitions_association
    end
  end
end
