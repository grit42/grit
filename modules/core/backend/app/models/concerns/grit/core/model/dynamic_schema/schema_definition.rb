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
  #
  # Note that this is the *real* PostgreSQL limit on one identifier, not a budget
  # shared with the table and column identifiers: each of those names an object
  # of its own now and gets its own 63 bytes.
  MAX_SCHEMA_PREFIX_LENGTH = 63 - (1 + MAX_IDENTIFIER_LENGTH)

  # Schema names PostgreSQL owns, or that grit's static tables live in. A
  # definition resolving onto one of these would fail on `create_schema` — or,
  # far worse, succeed on `drop_schema`. `pg_` is reserved wholesale by
  # PostgreSQL (`pg_catalog`, `pg_toast`, the per-session `pg_temp_N`), which is
  # why it is a prefix match rather than another list entry.
  RESERVED_SCHEMA_NAMES = %w[public information_schema].freeze
  RESERVED_SCHEMA_NAME_PREFIX = "pg_"

  # Every prefix any includer has declared, in declaration order. Nothing in the
  # concern reads it; it is there for `structure.sql`, which is dumped by pg_dump
  # and would otherwise carry every schema these definitions have built in
  # whatever database was dumped. See the `exclude_dynamic_schemas` task in
  # Grit::Core::Engine, which turns each entry into an `--exclude-schema` pattern.
  #
  # Kept here because only the concern knows what has been declared, and appended
  # to from `SchemaPrefixWriter` so that a direct `self.schema_prefix =` registers
  # too.
  SCHEMA_PREFIXES = Set.new

  def self.schema_prefixes
    SCHEMA_PREFIXES
  end

  # Prepended to the includer's singleton class so that a direct
  # `self.schema_prefix = "..."` is held to the same rules as the
  # `dynamic_schema_prefix` macro. `class_attribute` defines its writer straight
  # onto the singleton, so a `def self.schema_prefix=` in `included do` would
  # replace it outright with no `super` left to reach; prepending puts this one
  # ahead of it instead.
  module SchemaPrefixWriter
    def schema_prefix=(prefix)
      # nil is how the attribute starts and how it is unset; nothing to check.
      return super if prefix.nil?
      prefix = prefix.to_s
      raise ArgumentError, "Dynamic schema prefix #{prefix.inspect} should start with two lowercase letters or underscores and contain only lowercase letters, numbers and underscores" unless IDENTIFIER_FORMAT.match?(prefix)
      raise ArgumentError, "Dynamic schema prefix #{prefix.inspect} is #{prefix.bytesize} bytes; at most #{MAX_SCHEMA_PREFIX_LENGTH}, so that a #{prefix}_<schema> schema name survives PostgreSQL's 63 byte limit" if prefix.bytesize > MAX_SCHEMA_PREFIX_LENGTH
      SCHEMA_PREFIXES << prefix
      super(prefix)
    end
  end

  # Only class-level declarations belong in `included do`. Instance methods stay
  # in the module body so that an includer can override any of them and call
  # `super`; a `def` inside `included do` is defined directly on the includer,
  # which puts it out of reach of `super` and silently wins over anything the
  # includer declares.
  included do
    class_attribute :table_definitions_association, default: nil
    class_attribute :schema_prefix, default: nil
    singleton_class.prepend(SchemaPrefixWriter)
    class_attribute :before_drop_tables_callbacks, default: [].freeze
    class_attribute :after_create_tables_callbacks, default: [].freeze

    validate :schema_name_available, if: :identifier_changed?

    before_save :check_can_modify

    after_create :create_schema
    after_update :rename_schema

    before_destroy :check_can_modify
    before_destroy :drop_tables
    # `after_destroy`, not `before_destroy`: `dependent: :destroy` registers its
    # own `before_destroy` when the includer calls `has_many_table_definitions`,
    # i.e. after this module is included, so the table definitions are destroyed
    # *after* everything here — and their `drop_table` needs to still find the
    # schema standing.
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

  def schema_exists?
    ActiveRecord::Base.connection.schema_exists?(schema_name)
  end

  def quoted_schema_name
    ActiveRecord::Base.connection.quote_schema_name(schema_name)
  end

  # A PostgreSQL schema name is database-wide. It is not scoped to the definition
  # table the row came from, so two includers — a data set and a load set, say —
  # compete for one namespace, and no uniqueness validation or unique index can
  # see across them. The catalog is the only authority, hence `schema_exists?`.
  #
  # `if: :identifier_changed?` is what keeps this from rejecting a definition for
  # owning the schema it already owns: on any other update the name is not moving.
  def schema_name_available
    return if identifier.blank?
    name = schema_name
    if RESERVED_SCHEMA_NAMES.include?(name) || name.start_with?(RESERVED_SCHEMA_NAME_PREFIX)
      errors.add(:identifier, "would resolve to #{name}, a schema name PostgreSQL reserves")
    elsif ActiveRecord::Base.connection.schema_exists?(name)
      errors.add(:identifier, "is already taken: the schema #{name} already exists")
    end
  end

  def table_definitions
    association(self.table_definitions_association).reader
  end

  # Idempotent, so that callers need not track what has already been
  # materialised: `create_tables` below, and `TableDefinition#create_table` for a
  # definition whose creation was deferred past its schema's.
  def create_schema
    ActiveRecord::Base.connection.create_schema(schema_name, if_not_exists: true)
  end

  # Runs after the table definitions have been destroyed, so by now `drop_tables`
  # and each definition's own `after_destroy :drop_table` have emptied the schema.
  # The adapter hard-codes CASCADE, which is only safe for that reason: an
  # individual `drop_table` has no CASCADE and would already have raised on a
  # foreign key pointing in from outside, rather than letting this drop it.
  def drop_schema
    ActiveRecord::Base.connection.drop_schema(schema_name, if_exists: true)
  end

  # One statement moves every table, index and constraint in the schema, and none
  # of their names embed the schema, so there is nothing to re-canonicalise
  # afterwards — the fan-out over table definitions this used to need is gone.
  #
  # What ALTER SCHEMA does not do is tell ActiveRecord. It goes out through
  # `execute`, so unlike `rename_table` nothing evicts the pool-wide schema cache;
  # every table has to be dropped from it under both the name it had and the name
  # it now has.
  def rename_schema
    return unless identifier_previously_changed?
    previous_schema_name = schema_name_for(identifier_previously_was)
    return if previous_schema_name == schema_name
    connection = ActiveRecord::Base.connection
    # Not there under its old name: the schema was never materialised, or has
    # already been moved. Either way `create_schema` builds it under the new name.
    connection.rename_schema(previous_schema_name, schema_name) if connection.schema_exists?(previous_schema_name)
    table_definitions.each { |d| d.refresh_schema! d.table_name_for(previous_schema_name) }
  end

  def create_tables
    self.create_schema
    self.table_definitions.each(&:create_table)
    self.after_create_tables_callbacks.each { |callback| self.send(callback) }
  end

  # Leaves the schema standing: this is the publish/unpublish hook, not the
  # teardown. The schema goes with the definition, in `drop_schema`.
  def drop_tables
    self.before_drop_tables_callbacks.each { |callback| self.send(callback) }
    self.table_definitions.each(&:drop_table)
  end

  class_methods do
    # Sets the prefix every schema built from this definition is named with.
    # Validated at class-definition time rather than on save: an over-long prefix
    # only shows up as a truncated schema name deep inside the `after_create`,
    # which would leave a definition row behind pointing at the wrong schema.
    # Better to fail at boot.
    #
    # The checks themselves live in `SchemaPrefixWriter`, so that assigning
    # `schema_prefix` directly — which `class_attribute` makes possible whether
    # or not anyone uses this macro — cannot skip them.
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
