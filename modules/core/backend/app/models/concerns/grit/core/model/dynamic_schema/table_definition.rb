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

module Grit::Core::Model::DynamicSchema::TableDefinition
  extend ActiveSupport::Concern
  include Grit::Core::Model::DynamicSchema::ValidIdentifier
  include Grit::Core::Model::DynamicSchema::Refusal

  # Foreign keys point at `id` unless declared otherwise.
  DEFAULT_FOREIGN_KEY_TARGET_COLUMN = "id"

  # Maps the SQL types `implementation_column_definitions` declares to grit
  # property types; unlisted spellings pass through. The inverse of
  # `DataType#sql_name` (which only rewrites integer/entity, string and
  # datetime), plus catalog spellings (`character varying`, `numeric`, `bool`).
  # Anything else must declare `type:`; see `ImplementationColumn#problems`.
  IMPLEMENTATION_COLUMN_TYPES = {
    "bigint" => "integer",
    "int8" => "integer",
    "int" => "integer",
    "int4" => "integer",
    "smallint" => "integer",
    "int2" => "integer",
    "varchar" => "string",
    "character varying" => "string",
    "char" => "string",
    "character" => "string",
    "bpchar" => "string",
    "numeric" => "decimal",
    "double precision" => "decimal",
    "float8" => "decimal",
    "real" => "decimal",
    "float4" => "decimal",
    "bool" => "boolean",
    "timestamp without time zone" => "datetime",
    "timestamp" => "datetime",
    "timestamp with time zone" => "datetime",
    "timestamptz" => "datetime"
  }.freeze

  # Property types the UI renders. A constant so validations don't depend on seeds.
  GRIT_PROPERTY_TYPES = %w[string text integer decimal date datetime boolean entity].freeze

  # Far below PostgreSQL's 1600: the grid stops being usable long before.
  MAX_COLUMNS = 250

  # `<name>_<id in hex>_<suffix>`, the id zero-padded so that the name takes all
  # of PostgreSQL's 63 bytes. Longer than any identifier, so no table can take a
  # primary key index's name; and as the hex has no underscore, two names only
  # meet when both `name` and `id` do.
  def self.constraint_name(name, id, suffix)
    name = name.to_s
    limit = ActiveRecord::Base.connection.max_identifier_length
    width = limit - name.bytesize - suffix.bytesize - 2
    hex = id.to_s(16)
    raise ArgumentError, "Constraint name for #{name.inspect} and id #{id} would be over #{limit} bytes" if hex.bytesize > width
    "#{name}_#{hex.rjust(width, "0")}_#{suffix}"
  end

  included do
    class_attribute :column_definitions_association, default: nil
    class_attribute :schema_definition_association, default: nil

    # Guards; see `Refusal`.
    validate :refuse_unless_can_modify, except_on: :schema_commit, prepend: true
    validate :implementation_column_definitions_valid
    validate :identifier_unique_in_schema
    validate :schema_definition_unchanged
    validate :check_schema_draft, if: :structural_change?

    after_create :create_table

    # On the schema's cascade its drop takes the table; see `Refusal`.
    before_destroy :refuse_unless_can_modify, unless: :destroyed_by_parent_definition?
    before_destroy :refuse_unless_schema_draft, unless: :destroyed_by_parent_definition?
    after_destroy :drop_table, unless: :destroyed_by_parent_definition?
  end

  def committed?
    !!schema_definition&.committed?
  end

  # The table's name in a draft; not a valid identifier, so nothing else can hold it.
  def draft_table_identifier
    "t#{id}"
  end

  def draft_table_name
    "#{schema_definition.draft_schema_name}.#{draft_table_identifier}"
  end

  def committed_table_name
    "#{schema_definition.committed_schema_name}.#{identifier}"
  end

  # Named after the table like the table, so a commit renames it too.
  def draft_primary_key_name
    Grit::Core::Model::DynamicSchema::TableDefinition.constraint_name(draft_table_identifier, id, "pk")
  end

  def committed_primary_key_name
    Grit::Core::Model::DynamicSchema::TableDefinition.constraint_name(identifier, id, "pk")
  end

  # The current physical name. Not `table_name`, which is the definitions'
  # own table on the class.
  def physical_table_name
    committed? ? committed_table_name : draft_table_name
  end

  def physical_table_exists?
    ActiveRecord::Base.connection.table_exists?(physical_table_name)
  end

  def quoted_physical_table_name
    ActiveRecord::Base.connection.quote_table_name(physical_table_name)
  end

  def column_definitions
    association(self.column_definitions_association).reader
  end

  def schema_definition
    association(self.schema_definition_association).reader
  end

  # The schema the saved row belongs to: a refused move stays in memory, and
  # destroy doesn't validate.
  def schema_definition_in_database
    return schema_definition unless moved_to_another_schema?
    reflection = association(self.schema_definition_association).reflection
    reflection.klass.unscoped.find_by(reflection.association_primary_key => attribute_in_database(self.class.schema_definition_foreign_key))
  end

  def ordered_column_definitions
    definitions = column_definitions
    klass = definitions.klass
    definitions = definitions.includes(:data_type)
    return definitions.order(id: :asc) unless klass.column_names.include?("sort")
    definitions.order(Arel.sql("#{klass.quoted_table_name}.sort ASC NULLS LAST"), id: :asc)
  end

  # Columns every table gets on top of the base and dynamic ones. Override to
  # return an Array of `ImplementationColumn`s, or of Hashes with these keys
  # (any other raises):
  #
  #   identifier:     the column name
  #   data_type_name: the SQL type ("bigint", "varchar", ...)
  #   required:       truthy => NOT NULL
  #   foreign_key:    optional { table_name:, primary_key: "id" }, or an
  #                   `ImplementationColumn::ForeignKey`
  #   writable:       truthy => listed in `entity_fields`
  #   presented_when: optional keyword `entity_properties` must be passed truthy
  #                   for the column to be described
  #   display_name:   optional, defaults to the humanised identifier
  #   description:    optional
  #   type:           optional grit property type, defaults to the
  #                   IMPLEMENTATION_COLUMN_TYPES reading of `data_type_name`;
  #                   "entity" also needs an `entity:` Hash (see
  #                   `DataType#entity_definition`)
  #   default_hidden: truthy => hidden in the grid by default
  #
  # Describes the physical table, so it must not depend on `entity_properties`
  # keywords. Changes need a migration: see `add_implementation_column`. Read
  # it through `implementation_columns`.
  def implementation_column_definitions
    []
  end

  # `implementation_column_definitions`, coerced.
  def implementation_columns
    implementation_column_definitions.map do |column|
      Grit::Core::Model::DynamicSchema::ImplementationColumn.coerce(column)
    rescue ArgumentError => e
      raise e.exception("#{self.class.name}#implementation_column_definitions: #{e.message}")
    end
  end

  # Whether `entity_properties(**args)` describes the `ImplementationColumn`;
  # it exists either way.
  def implementation_column_presented?(column, **args)
    gate = column.presented_when
    gate.nil? || !!args[gate]
  end

  # Read-only unless declared `writable: true`: the implementation owns the values.
  def implementation_column_writable?(column)
    column.writable
  end

  # An instance method so includers can override it with `super`.
  def implementation_column_properties(**args)
    implementation_columns.filter_map do |column|
      next unless implementation_column_presented?(column, **args)
      {
        name: column.identifier,
        display_name: column.display_name || column.identifier.humanize,
        description: column.description,
        type: column.property_type,
        required: column.required,
        unique: false,
        entity: column.entity,
        default_hidden: column.default_hidden
      }
    end
  end

  # Base columns, plus implementation columns not declared `writable`.
  def read_only_property_names
    Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS +
      implementation_columns
        .reject { |column| implementation_column_writable?(column) }
        .map(&:identifier)
  end

  # Base, implementation and dynamic columns: what `MAX_COLUMNS` limits.
  def physical_column_count(excluding: nil)
    columns = column_definitions
    count = Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS.length +
      implementation_columns.length +
      columns.size
    count -= 1 if excluding && columns.include?(excluding)
    count
  end

  def create_implementation_column_foreign_keys(columns = implementation_columns, table_name: draft_table_name)
    columns.each do |column|
      next unless column.foreign_key
      add_column_foreign_key column.identifier, column.foreign_key.table_name, column.target_column, table_name: table_name
    end
  end

  # Why `add_implementation_column` cannot add `column` to this table, or nil.
  def implementation_column_addition_problem(column)
    errors.clear
    implementation_column_definitions_valid
    return errors.full_messages.join("; ") if errors.any?
    if column_definitions.exists?(identifier: column.identifier)
      return "a column definition is already identified #{column.identifier}"
    end
    return if physical_column_count <= MAX_COLUMNS
    "the table would have more than #{MAX_COLUMNS} columns"
  end

  # `owner_id` is the column definition's id, or this table's for an
  # implementation column.
  def add_column_foreign_key(column_name, target_table_name, target_column = DEFAULT_FOREIGN_KEY_TARGET_COLUMN, owner_id: id, table_name: draft_table_name)
    ActiveRecord::Base.connection.add_foreign_key table_name, target_table_name, column: column_name, primary_key: target_column, name: foreign_key_name(column_name, owner_id), if_not_exists: true
  end

  # Named after the column it is on (`c<id>` or the identifier), so a commit
  # renames those of dynamic columns; implementation columns keep theirs.
  def foreign_key_name(column_name, owner_id = id)
    Grit::Core::Model::DynamicSchema::TableDefinition.constraint_name(column_name, owner_id, "fk")
  end

  # Committed schemas only. Rebuilt on every call (definitions change without
  # DDL), after dropping the table from the schema cache so the class always
  # sees the table as it is now. That costs catalog queries on every call:
  # call it once per request or job and hold the class for that unit of work.
  # Do not keep it across requests, as a revert and recommit leaves a held
  # class with stale columns.
  #
  # Rows are read and written as `DynamicRecord` describes.
  def record_klass
    raise "#{identifier} is a draft: commit #{schema_definition&.committed_schema_name} before reading or writing its tables" unless committed?
    Grit::Core::Model::DynamicSchema::DynamicRecord.for(self)
  end

  private

  # Whether saving touches the physical table; `name` and `sort` can change any time.
  def structural_change?
    new_record? || identifier_changed? || moved_to_another_schema?
  end

  # A saved table pointed at another schema, which `schema_definition_unchanged`
  # refuses.
  def moved_to_another_schema?
    return false if new_record? || self.class.schema_definition_association.nil?
    attribute_changed?(self.class.schema_definition_foreign_key)
  end

  # See `Refusal`.
  def destroyed_by_parent_definition?
    destroyed_through?(self.class.schema_definition_association)
  end

  # Locks the schema row so a commit can't race the change. Adds the error and
  # says whether the change may proceed; `refuse_unless_schema_draft` throws on
  # false.
  def check_schema_draft
    return true if self.class.schema_definition_association.nil?
    schema = schema_definition_in_database
    return true if schema.nil? || schema.new_record?
    locked = schema.locked_copy
    return true unless locked&.committed?
    errors.add(:base, "#{locked.committed_schema_name} is committed: revert it to draft to change its structure")
    false
  end

  def refuse_unless_schema_draft
    throw :abort unless check_schema_draft
  end

  # Among the schema's definitions only; the catalog is not consulted.
  def identifier_unique_in_schema
    return if self.class.schema_definition_association.nil?
    return if identifier.blank?
    foreign_key = self.class.schema_definition_foreign_key
    return if self[foreign_key].blank?
    klass = self.class.base_class
    scope = klass.unscoped.where(foreign_key => self[foreign_key], identifier: identifier)
    scope = scope.where.not(id: id) if persisted?
    errors.add(:identifier, "is already taken by another table of this schema") if scope.exists?
  end

  def schema_definition_unchanged
    return unless moved_to_another_schema?
    errors.add(:base, "A table definition cannot be moved to another schema")
  end

  # Declarations skip the `identifier` validations, so `problems` checks them
  # against the same rules. Each duplicate is reported once.
  def implementation_column_definitions_valid
    seen = Set.new
    duplicates = Set.new
    implementation_columns.each do |column|
      identifier = column.identifier
      if seen.include?(identifier)
        errors.add(:base, "Implementation column #{identifier.inspect} is declared more than once") if duplicates.add?(identifier)
        next
      end
      seen.add(identifier) unless identifier.empty?
      column.problems.each { |problem| errors.add(:base, problem) }
    end
  end

  # Table DDL only runs in a draft (`check_schema_draft`), so it uses draft names.
  def create_table
    connection = ActiveRecord::Base.connection
    # Skips Rails' length check, which measures `<schema>.<table>` as a whole.
    connection.create_table draft_table_name, id: false, _uses_legacy_table_name: true do |t|
      create_base_columns t
      create_implementation_columns t
    end
    # Added here as `create_table` can't name it.
    connection.execute(<<~SQL.squish)
      ALTER TABLE #{connection.quote_table_name(draft_table_name)}
      ADD CONSTRAINT #{connection.quote_column_name(draft_primary_key_name)} PRIMARY KEY (id)
    SQL
    create_implementation_column_foreign_keys
  end

  def create_base_columns(t)
    t.bigint :id, null: false, default: -> { "nextval('grit_seq'::regclass)" }
    t.string :created_by, limit: 30, null: false, default: "SYSTEM"
    t.datetime :created_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
    t.string :updated_by, limit: 30
    t.datetime :updated_at
  end

  def create_implementation_columns(t)
    implementation_columns.each do |column|
      t.column column.identifier, column.data_type_name, null: !column.required
    end
  end

  # Destroy callbacks also run on unsaved records, which have no table.
  def drop_table
    return if id.nil?
    schema = schema_definition_in_database
    return if schema.nil?
    ActiveRecord::Base.connection.drop_table "#{schema.draft_schema_name}.#{draft_table_identifier}", if_exists: true
  end

  class_methods do
    # `options` go to `has_many`, but not `dependent:`: the cascade is
    # `:destroy`, so includers' column callbacks run; the concern's own guard,
    # draft check and DROP COLUMN are skipped, as the table's drop takes the
    # columns. The cascade destroys the target as loaded, which `size` loads
    # empty before the first column; reset so it reads the rows.
    def has_many_column_definitions(name, **options)
      raise ArgumentError, "has_many_column_definitions sets dependent: :destroy itself" if options.key?(:dependent)
      self.column_definitions_association = name
      before_destroy { association(name).reset }
      has_many name, **options, dependent: :destroy
    end

    # `options` go to `belongs_to`; the concern reads the foreign key and its
    # target from the reflection.
    def belongs_to_schema_definition(name, **options)
      self.schema_definition_association = name
      belongs_to name, **options
    end

    def schema_definition_foreign_key
      reflect_on_association(schema_definition_association).foreign_key.to_sym
    end

    # Implementation columns are code: a change to them ships with a migration
    # that applies it to every table, draft or committed, with these helpers.
    # The migration drops and recreates dependent views itself.
    #
    # Yields each table definition (reloaded) and its current physical table
    # name, in a savepoint under its schema's row lock so a commit or revert
    # can't interleave. Tables whose schema definition is gone are skipped.
    def each_physical_table
      raise ArgumentError, "#{name} must declare belongs_to_schema_definition" if schema_definition_association.nil?
      connection = ActiveRecord::Base.connection
      base_class.unscoped.find_each do |table_definition|
        transaction(requires_new: true) do
          schema = table_definition.schema_definition&.locked_copy
          next if schema.nil?
          table_definition.reload
          table_definition.association(schema_definition_association).target = schema
          table_name = table_definition.physical_table_name
          raise "#{table_name}, the table of #{name} #{table_definition.identifier}, does not exist" unless connection.table_exists?(table_name)
          yield table_definition, table_name
          connection.clear_cache!
          ActiveRecord::Base.connection_pool.schema_cache.clear_data_source_cache!(table_name)
        end
      end
    end

    # Adds `identifier` to every table that declares it: nullable, then the
    # block fills it in (raw SQL on the given table name), then NOT NULL if
    # `required:`, then the foreign key. Safe to re-run.
    #
    #   SDTMModelDomain.add_implementation_column(:site_id) do |_domain, table_name|
    #     execute "UPDATE #{quote_table_name(table_name)} SET site_id = ..."
    #   end
    def add_implementation_column(identifier, &backfill)
      identifier = identifier.to_s
      connection = ActiveRecord::Base.connection
      tables = 0
      declared = 0
      each_physical_table do |table_definition, table_name|
        tables += 1
        column = table_definition.implementation_columns.find { |declaration| declaration.identifier == identifier }
        next if column.nil?
        declared += 1
        problem = table_definition.implementation_column_addition_problem(column)
        raise ArgumentError, "Cannot add #{identifier} to #{table_name}: #{problem}" unless problem.nil?

        connection.add_column table_name, identifier, column.data_type_name, null: true unless connection.column_exists?(table_name, identifier)
        backfill&.call(table_definition, table_name)
        if column.required
          quoted_table_name = connection.quote_table_name(table_name)
          if connection.select_value("SELECT 1 FROM #{quoted_table_name} WHERE #{connection.quote_column_name(identifier)} IS NULL LIMIT 1")
            raise "Cannot require #{identifier} on #{table_name}: some rows have no value; fill them in from the block"
          end
          connection.change_column_null table_name, identifier, false
        end
        table_definition.create_implementation_column_foreign_keys([ column ], table_name: table_name)
      end
      # An empty database has nothing to migrate.
      raise ArgumentError, "No #{name} declares the implementation column #{identifier.inspect}" if tables.positive? && declared.zero?
    end

    # Drops `identifier` and its foreign key from every table. Remove the
    # declaration first.
    def remove_implementation_column(identifier)
      identifier = identifier.to_s
      connection = ActiveRecord::Base.connection
      each_physical_table do |table_definition, table_name|
        if table_definition.implementation_columns.any? { |declaration| declaration.identifier == identifier }
          raise ArgumentError, "#{name} #{table_definition.identifier} still declares the implementation column #{identifier}; remove it from implementation_column_definitions first"
        end
        # On a committed table the name belongs to a column definition; the
        # implementation column can't still be there.
        next if table_definition.committed? && table_definition.column_definitions.exists?(identifier: identifier)
        connection.remove_column table_name, identifier, if_exists: true
      end
    end
  end
end
