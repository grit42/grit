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

module Grit::Core::Model::DynamicSchema::SchemaDefinition
  extend ActiveSupport::Concern
  include Grit::Core::Model::DynamicSchema::ValidIdentifier

  MAX_IDENTIFIER_LENGTH = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
  IDENTIFIER_FORMAT = Grit::Core::Model::DynamicSchema::ValidIdentifier::IDENTIFIER_FORMAT

  # A schema name is `<schema_prefix>_<identifier>`, and PostgreSQL truncates any
  # identifier past NAMEDATALEN - 1 = 63 bytes, silently, at parse time. The
  # prefix gets whatever a maximum-length identifier and the separator leave over.
  MAX_SCHEMA_PREFIX_LENGTH = 63 - (1 + MAX_IDENTIFIER_LENGTH)

  # Schema names PostgreSQL owns, or that grit's static tables live in. A
  # definition resolving onto one of these would fail on `create_schema` — or,
  # far worse, succeed on `drop_schema`. `pg_` is reserved wholesale by
  # PostgreSQL (`pg_catalog`, `pg_toast`, the per-session `pg_temp_N`), which is
  # why it is a prefix match rather than another list entry.
  RESERVED_SCHEMA_NAMES = %w[public information_schema].freeze
  RESERVED_SCHEMA_NAME_PREFIX = "pg_"

  # Every prefix declared in `config.grit.dynamic_schema_prefixes`, each held to
  # the rules `dynamic_schema_prefix` checks. They are there for `structure.sql`,
  # which is dumped by pg_dump and would otherwise carry every schema these
  # definitions have built in whatever database was dumped. See
  # `Grit::Core::Engine::ExcludeDynamicSchemasFromStructureDump`, which turns each
  # into an `--exclude-schema` pattern.
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

  # Prepended to the includer's singleton class so that a direct
  # `self.schema_prefix = "..."` is held to the same rules as the
  # `dynamic_schema_prefix` macro. `class_attribute` defines its writer straight
  # onto the singleton, so a `def self.schema_prefix=` in `included do` would
  # replace it outright with no `super` left to reach; prepending puts this one
  # ahead of it instead.
  #
  # A prefix missing from `config.grit.dynamic_schema_prefixes` is refused: the
  # structure dump would not know to leave its schemas out.
  module SchemaPrefixWriter
    def schema_prefix=(prefix)
      # nil is how the attribute starts and how it is unset; nothing to check.
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
    class_attribute :before_drop_tables_callbacks, default: [].freeze
    class_attribute :after_create_tables_callbacks, default: [].freeze

    validate :schema_prefix_declared
    validate :schema_name_available, if: :identifier_changed?

    before_save :check_can_modify

    after_create :claim_schema
    after_update :rename_schema

    before_destroy :check_can_modify
    before_destroy :run_before_drop_tables_callbacks
    after_destroy :drop_schema
  end

  # Guard run before every save and before destroy. A no-op by default so that
  # includers are free to create, update and destroy definitions. Override it
  # to forbid modification once the schema is in use, e.g.:
  #
  #   def check_can_modify
  #     super
  #     raise "Cannot modify a published data set" if published?
  #   end
  def check_can_modify
  end

  # The schema name a given identifier composes to. Defaults to what this
  # definition currently carries, so `schema_name_for` with no argument is
  # `schema_name`; `rename_schema` uses it to name the schema this definition
  # used to have.
  def schema_name_for(schema_definition_identifier = nil)
    "#{self.schema_prefix}_#{schema_definition_identifier || self.identifier}"
  end

  def schema_name
    schema_name_for
  end

  # The schema this definition's saved row resolves to, or nil before it has
  # one. What the drop paths name rather than `schema_name`, which follows the
  # identifier in memory: after a rename `schema_name_available` refused, that
  # is another definition's identifier, and DROP SCHEMA cascades.
  def schema_name_in_database
    saved_identifier = identifier_in_database
    schema_name_for(saved_identifier) unless saved_identifier.nil?
  end

  def schema_exists?
    ActiveRecord::Base.connection.schema_exists?(schema_name)
  end

  def quoted_schema_name
    ActiveRecord::Base.connection.quote_schema_name(schema_name)
  end

  def schema_prefix_declared
    return if self.schema_prefix.present?
    errors.add(:base, "#{self.class.name} must declare a dynamic_schema_prefix")
  end

  def schema_name_available
    return if identifier.blank?
    return if self.schema_prefix.blank?
    name = schema_name
    if RESERVED_SCHEMA_NAMES.include?(name) || name.start_with?(RESERVED_SCHEMA_NAME_PREFIX)
      errors.add(:identifier, "would resolve to #{name}, a schema name PostgreSQL reserves")
    elsif sibling_resolves_to_schema?(name)
      errors.add(:identifier, "is already taken: another definition resolves to the schema #{name}")
    elsif ActiveRecord::Base.connection.schema_exists?(name)
      errors.add(:identifier, "is already taken: the schema #{name} already exists")
    end
  end

  def sibling_resolves_to_schema?(name)
    scope = self.class.base_class.unscoped.where(identifier: identifier)
    scope = scope.where.not(id: id) if persisted?
    scope.any? { |sibling| sibling.schema_name == name }
  end

  def table_definitions
    association(self.table_definitions_association).reader
  end

  def create_schema
    ActiveRecord::Base.connection.create_schema(schema_name, if_not_exists: true)
  end

  # What a new definition creates its schema with: `create_schema` without
  # `if_not_exists`. A schema that is already there at this point belongs to
  # something `schema_name_available` could not see, such as a definition from
  # another includer created concurrently, which resolves to the same name and
  # has not committed yet. Adopting it would let `drop_schema` CASCADE over
  # that definition's tables. PostgreSQL raising here rolls the create back.
  def claim_schema
    ActiveRecord::Base.connection.create_schema(schema_name)
  end

  def drop_schema
    name = schema_name_in_database
    ActiveRecord::Base.connection.drop_schema(name, if_exists: true) unless name.nil?
  end

  def rename_schema
    return unless identifier_previously_changed?
    previous_schema_name = schema_name_for(identifier_previously_was)
    return if previous_schema_name == schema_name
    connection = ActiveRecord::Base.connection
    connection.rename_schema(previous_schema_name, schema_name) if connection.schema_exists?(previous_schema_name)
    table_definitions.each { |d| d.refresh_schema! d.table_name_for(previous_schema_name) }
  end

  def create_tables
    ActiveRecord::Base.transaction do
      self.create_schema
      self.table_definitions.each(&:create_table)
      self.after_create_tables_callbacks.each { |callback| self.send(callback) }
    end
  end

  def drop_tables
    ActiveRecord::Base.transaction do
      run_before_drop_tables_callbacks
      self.table_definitions.each(&:drop_table)
    end
  end

  def run_before_drop_tables_callbacks
    self.before_drop_tables_callbacks.each { |callback| self.send(callback) }
  end

  class_methods do
    def dynamic_schema_prefix(prefix)
      self.schema_prefix = prefix
    end

    def before_drop_tables(*names)
      self.before_drop_tables_callbacks += names
    end

    def after_create_tables(*names)
      self.after_create_tables_callbacks += names
    end

    def has_many_table_definitions(table_definitions_association)
      has_many table_definitions_association, dependent: :destroy
      self.table_definitions_association = table_definitions_association
    end
  end
end
