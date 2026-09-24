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

  MAX_IDENTIFIER_LENGTH = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
  IDENTIFIER_FORMAT = Grit::Core::Model::DynamicSchema::ValidIdentifier::IDENTIFIER_FORMAT

  # The column a foreign key points at when nothing says otherwise. Every dynamic
  # table and every grit entity table is keyed on `id`, so this is what a
  # constraint name's second half almost always is.
  DEFAULT_FOREIGN_KEY_TARGET_COLUMN = "id"

  # `implementation_column_definitions` describes its columns by SQL type;
  # `entity_properties` describes them by grit property type. Anything not
  # listed is passed through as-is.
  #
  # The inverse of `Grit::Core::DataType#sql_name`, which is the forward map and
  # rewrites exactly three things: integer (and every entity type) to bigint,
  # string to varchar, datetime to timestamp without time zone. Only those three
  # need inverting — `text`, `decimal`, `date` and `boolean` are each their own
  # grit data type *and* their own SQL type, so the passthrough below is already
  # right for them. Mapping "text" to "string" would demote a multiline input to
  # a single-line one.
  #
  # Not derived from the DataType table, because the inverse is genuinely
  # ambiguous: `bigint` is the sql_name of `integer` and of every entity type.
  #
  # Keyed on *spellings*, not on canonical types, and an unlisted spelling is
  # passed through — which is why the PostgreSQL names sit here next to the ones
  # `sql_name` emits. `implementation_column_definitions` is hand-written, and
  # anyone reading a column's type out of structure.sql, pg_dump or the catalog
  # finds `character varying` and `timestamp without time zone`, never `varchar`.
  # Which is also why the catalog spellings of types `sql_name` never emits are
  # here: pg_catalog says `numeric`, not `decimal`, and `bool`, not `boolean`.
  #
  # A spelling that falls through and is not already a grit property type reaches
  # the UI as a type no form field and no grid cell renderer matches — a blank
  # cell with no editor. Because this map can never cover every type PostgreSQL
  # has, `validate_implementation_column_shape` rejects what falls through rather
  # than letting it get that far.
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

  # The property types the UI can render: the non-entity data types `db/seeds.rb`
  # seeds, plus `entity`. A constant rather than a query on `Grit::Core::DataType`
  # because a validation must not depend on whether the seeds have been run.
  GRIT_PROPERTY_TYPES = %w[string text integer decimal date datetime boolean entity].freeze

  # How many columns a dynamic table may have. PostgreSQL's own ceiling is 1600;
  # this is far lower because the grid stops being usable long before that.
  # Enforced from `ColumnDefinition#columns_count_within_limit`.
  MAX_COLUMNS = 250

  included do
    class_attribute :column_definitions_association, default: nil
    class_attribute :schema_definition_association, default: nil

    before_save :check_can_modify
    after_create :create_table, if: :create_table_on_create?
    after_update :rename_table
    before_destroy :check_can_modify
    after_destroy :drop_table

    validate :implementation_column_definitions_valid
    validate :identifier_unique_in_schema
    validate :schema_definition_unchanged
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

  def table_name_for(schema_name = nil, table_identifier = nil)
    schema_name ||= self.schema_definition.schema_name
    table_identifier ||= self.identifier
    "#{schema_name}.#{table_identifier}"
  end

  def table_name
    table_name_for
  end

  def table_exists?
    ActiveRecord::Base.connection.table_exists?(table_name)
  end

  def quoted_table_name
    ActiveRecord::Base.connection.quote_table_name(table_name)
  end

  def column_definitions
    association(self.column_definitions_association).reader
  end

  def schema_definition
    association(self.schema_definition_association).reader
  end

  def identifier_unique_in_schema
    return if self.class.schema_definition_association.nil?
    return if identifier.blank?
    foreign_key = self.class.schema_definition_id
    return if self[foreign_key].blank?
    return unless new_record? || identifier_changed? || attribute_changed?(foreign_key)
    return if schema_definition.nil?
    klass = self.class.base_class
    scope = klass.unscoped.where(foreign_key => self[foreign_key], identifier: identifier)
    scope = scope.where.not(id: id) if persisted?
    if scope.exists?
      errors.add(:identifier, "is already taken: another definition resolves to the table #{table_name}")
    elsif table_exists?
      errors.add(:identifier, "is already taken: the table #{table_name} already exists")
    end
  end

  def schema_definition_unchanged
    return if self.class.schema_definition_association.nil?
    return if new_record?
    return unless attribute_changed?(self.class.schema_definition_id)
    errors.add(:base, "A table definition cannot be moved to another schema")
  end

  def ordered_column_definitions
    definitions = column_definitions
    klass = definitions.klass
    definitions = definitions.includes(:data_type)
    return definitions.order(id: :asc) unless klass.column_names.include?("sort")
    definitions.order(Arel.sql("#{klass.quoted_table_name}.sort ASC NULLS LAST"), id: :asc)
  end

  # Columns every table built from this definition gets, on top of the base
  # columns (`id`, `created_by`, `created_at`, `updated_by`, `updated_at`) and
  # the user-defined ones described by `column_definitions`. Empty by default;
  # override in the includer to return an Array of Hashes:
  #
  #   identifier:     String, the column name
  #   data_type_name: String, the SQL type ("bigint", "varchar", ...)
  #   required:       truthy => NOT NULL
  #   foreign_key:    optional Hash, { table_name: "grit_core_users" }, adds a
  #                   foreign key from this column to that table's `id`. Pass
  #                   `primary_key:` as well to point it at another column; that
  #                   column's name is the second half of the constraint name
  #   writable:       truthy => the column appears in `entity_fields`; see
  #                   `implementation_column_writable?`
  #   presented_when: optional Symbol, a keyword that has to be passed truthy to
  #                   `entity_properties` for the column to be described at all;
  #                   see `implementation_column_presented?`
  #   display_name:   optional String, defaults to the humanised identifier
  #   description:    optional String
  #   type:           optional String, the grit property type, defaulting to
  #                   IMPLEMENTATION_COLUMN_TYPES' reading of `data_type_name`.
  #                   "entity" also wants an `entity:` Hash of the shape
  #                   `DataType#entity_definition` returns
  #   default_hidden: truthy => the grid hides the column until asked
  #
  # This list describes the *physical* table, so it must not vary with the
  # keywords callers pass to `entity_properties` / `entity_fields` /
  # `entity_columns` — `presented_when` is how a column is hidden from those
  # without being dropped from the table. e.g.
  #
  #   def implementation_column_definitions
  #     [ { identifier: "experiment_id", data_type_name: "bigint", required: true,
  #         writable: true, presented_when: :with_experiment_id,
  #         foreign_key: { table_name: "grit_assays_experiments" } } ]
  #   end
  def implementation_column_definitions
    []
  end

  # Whether `entity_properties(**args)` — and so `entity_fields` and
  # `entity_columns` — should describe this column at all. The physical column is
  # there either way; this only decides whether callers are told about it.
  # `presented_when: :with_experiment_id` describes the column only when that
  # keyword is passed truthy. Override for anything richer.
  def implementation_column_presented?(column, **args)
    gate = column[:presented_when]
    gate.nil? || !!args[gate.to_sym]
  end

  # Implementation columns are read-only by default: the implementation that
  # declared them owns their values, the same way `set_updater` and the database
  # defaults own the base columns. `writable: true` hands that ownership to the
  # caller — a loader writing `experiment_id` from its load-set block, say.
  def implementation_column_writable?(column)
    !!column[:writable]
  end

  # Property descriptions for the columns `implementation_column_definitions`
  # adds. An instance method rather than one on the anonymous `record_klass`, so
  # that an includer can override it and call `super`; a singleton method on an
  # anonymous class is out of reach.
  def implementation_column_properties(**args)
    implementation_column_definitions.filter_map do |column|
      next unless implementation_column_presented?(column, **args)
      data_type_name = column[:data_type_name].to_s
      {
        name: column[:identifier].to_s,
        display_name: column[:display_name] || column[:identifier].to_s.humanize,
        description: column[:description],
        type: (column[:type] || IMPLEMENTATION_COLUMN_TYPES.fetch(data_type_name, data_type_name)).to_s,
        required: !!column[:required],
        unique: false,
        entity: column[:entity],
        default_hidden: !!column[:default_hidden]
      }
    end
  end

  # The properties `entity_fields` refuses to hand out as writable fields: the
  # base columns, plus every implementation column that has not opted in.
  def read_only_property_names
    Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS +
      implementation_column_definitions
        .reject { |column| implementation_column_writable?(column) }
        .map { |column| column[:identifier].to_s }
  end

  # `implementation_column_definitions` is a hand-written Hash that reaches the
  # database without passing through any of the `identifier` validations, so it is
  # checked here instead — against the same rules, and against the same byte
  # budget the schema prefix is held to.
  # Duplicates are checked and recorded before the branch chain, not inside it.
  # `seen.push` on the final branch only would mean an identifier that trips an
  # earlier check never registers, so its repeat goes unreported and the developer
  # discovers the duplicate only after fixing the length — two round trips for one
  # declaration. Each identifier is reported once however many times it repeats,
  # and a repeat is not re-validated.
  def implementation_column_definitions_valid
    seen = []
    reported_duplicates = []
    implementation_column_definitions.each do |column|
      identifier = column[:identifier].to_s
      if identifier.empty?
        errors.add(:base, "An implementation column is missing an identifier")
        next
      end
      if seen.include?(identifier)
        unless reported_duplicates.include?(identifier)
          errors.add(:base, "Implementation column #{identifier.inspect} is declared more than once")
          reported_duplicates.push(identifier)
        end
        next
      end
      seen.push(identifier)
      if !IDENTIFIER_FORMAT.match?(identifier)
        errors.add(:base, "Implementation column #{identifier.inspect} should start with two lowercase letters or underscores and contain only lowercase letters, numbers and underscores")
      elsif identifier.bytesize > MAX_IDENTIFIER_LENGTH
        errors.add(:base, "Implementation column #{identifier.inspect} is #{identifier.bytesize} bytes; at most #{MAX_IDENTIFIER_LENGTH}")
      elsif Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS.include?(identifier)
        errors.add(:base, "Implementation column #{identifier.inspect} is a base column of every dynamic table")
      else
        validate_implementation_column_shape(column, identifier)
      end
    end
  end

  def validate_implementation_column_shape(column, identifier)
    errors.add(:base, "Implementation column #{identifier.inspect} is missing a data_type_name") if column[:data_type_name].to_s.empty?
    errors.add(:base, "Implementation column #{identifier.inspect} is declared as an entity but carries no entity definition") if column[:type].to_s == "entity" && column[:entity].nil?
    validate_implementation_column_property_type(column, identifier)

    foreign_key = column[:foreign_key]
    return if foreign_key.nil?

    errors.add(:base, "Implementation column #{identifier.inspect} has a foreign key with no table_name") if foreign_key[:table_name].to_s.empty?

    target_column = implementation_column_target_column(column)
    name = "#{identifier}_#{target_column}"
    limit = ActiveRecord::Base.connection.max_identifier_length
    return unless name.bytesize > limit
    errors.add(:base, "Implementation column #{identifier.inspect} would need the foreign key constraint #{name.inspect}, which is #{name.bytesize} bytes; PostgreSQL truncates at #{limit}")
  end

  # A column whose `data_type_name` is not one `IMPLEMENTATION_COLUMN_TYPES` can
  # read has to say what it is. `jsonb`, `inet`, a domain type — PostgreSQL has
  # hundreds, and the map covers the handful `sql_name` emits plus their catalog
  # spellings. Without this the column is built correctly and then described to
  # the UI as a property type nothing renders: a blank cell with no editor, and
  # nothing anywhere saying why. An explicit `type:` is the way to use one.
  def validate_implementation_column_property_type(column, identifier)
    return if column[:type].present?
    data_type_name = column[:data_type_name].to_s
    return if data_type_name.empty?
    property_type = IMPLEMENTATION_COLUMN_TYPES.fetch(data_type_name, data_type_name)
    return if GRIT_PROPERTY_TYPES.include?(property_type)
    errors.add(:base, "Implementation column #{identifier.inspect} has data_type_name #{data_type_name.inspect}, which is not one of #{GRIT_PROPERTY_TYPES.join(", ")}; declare the grit property type with type:")
  end

  # Every column the physical table has, or will have once it is materialised: the
  # base columns, the declared implementation columns and the dynamic ones. What
  # `ColumnDefinition#columns_count_within_limit` measures against `MAX_COLUMNS`.
  #
  # `size` rather than `count`: this is reached from an `on: :create` validation,
  # and `count` queries even when the association is already loaded — 200 extra
  # round trips to import a 200-column sheet.
  def physical_column_count
    Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS.length +
      implementation_column_definitions.length +
      column_definitions.size
  end

  # Whether creating the definition should materialise its table straight away.
  # True by default; override to return false and call `create_table` yourself
  # (or `SchemaDefinition#create_tables`) at whatever point the schema is
  # considered settled, e.g. a publish step.
  def create_table_on_create?
    true
  end

  def create_table
    connection = ActiveRecord::Base.connection
    columns = ordered_column_definitions.to_a
    ActiveRecord::Base.transaction do
      schema_definition.create_schema
      # `_uses_legacy_table_name: true` skips exactly one check, and only that
      # one: `validate_table_length!`, which measures the whole `<schema>.<table>`
      # string — dot and schema included — against PostgreSQL's *per identifier*
      # limit. Rails whitelists this option in `validate_create_table_options!`
      # as the opt-out.
      connection.create_table table_name, id: false, if_not_exists: true, _uses_legacy_table_name: true do |t|
        create_base_columns t
        create_implementation_columns t
        create_dynamic_columns t, columns
      end
      create_foreign_keys columns
    end
    refresh_schema!
  end

  def create_base_columns(t)
    t.bigint :id, primary_key: true, default: -> { "nextval('grit_seq'::regclass)" }
    t.string :created_by, limit: 30, null: false, default: "SYSTEM"
    t.datetime :created_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
    t.string :updated_by, limit: 30
    t.datetime :updated_at
  end

  def create_implementation_columns(t)
    implementation_column_definitions.each do |column|
      t.column column[:identifier], column[:data_type_name], null: !column[:required]
    end
  end

  def create_dynamic_columns(t, columns = ordered_column_definitions)
    columns.each do |column|
      t.column column.identifier, column.data_type.sql_name, null: !column.required
    end
  end

  def create_dynamic_column_foreign_keys(columns = ordered_column_definitions)
    connection = ActiveRecord::Base.connection
    columns.each do |column|
      next unless column.data_type.is_entity
      target_column = DEFAULT_FOREIGN_KEY_TARGET_COLUMN
      connection.add_foreign_key table_name, column.data_type.table_name, column: column.identifier, primary_key: target_column, name: foreign_key_name(column.identifier, target_column), if_not_exists: true
    end
  end

  def create_implementation_column_foreign_keys
    connection = ActiveRecord::Base.connection
    implementation_column_definitions.each do |column|
      foreign_key = column[:foreign_key]
      next unless foreign_key
      target_column = implementation_column_target_column(column)
      connection.add_foreign_key table_name, foreign_key[:table_name], column: column[:identifier], primary_key: target_column, name: foreign_key_name(column[:identifier], target_column), if_not_exists: true
    end
  end

  def implementation_column_target_column(column)
    (column.dig(:foreign_key, :primary_key) || DEFAULT_FOREIGN_KEY_TARGET_COLUMN).to_s
  end

  def create_foreign_keys(columns = ordered_column_definitions)
    create_implementation_column_foreign_keys
    create_dynamic_column_foreign_keys columns
  end

  def foreign_key_name(column_identifier, target_column = DEFAULT_FOREIGN_KEY_TARGET_COLUMN)
    name = "#{column_identifier}_#{target_column}"
    limit = ActiveRecord::Base.connection.max_identifier_length
    raise ArgumentError, "Foreign key name #{name.inspect} is #{name.bytesize} bytes; PostgreSQL truncates at #{limit}" if name.bytesize > limit
    name
  end

  def foreign_key_for_column(column_identifier)
    ActiveRecord::Base.connection.foreign_keys(table_name)
      .find { |fk| Array(fk.column).map(&:to_s) == [ column_identifier.to_s ] }
  end

  def rename_foreign_key(from_name, to_name)
    return to_name if from_name == to_name
    connection = ActiveRecord::Base.connection
    connection.execute(<<~SQL.squish)
      ALTER TABLE #{connection.quote_table_name(table_name)}
      RENAME CONSTRAINT #{connection.quote_column_name(from_name)}
                     TO #{connection.quote_column_name(to_name)}
    SQL
    to_name
  end

  def rename_foreign_key_for_column(column_identifier)
    foreign_key = foreign_key_for_column(column_identifier)
    return nil if foreign_key.nil?
    rename_foreign_key(foreign_key.name, foreign_key_name(column_identifier, foreign_key.primary_key))
  end

  def drop_table
    ActiveRecord::Base.connection.drop_table table_name, if_exists: true
    refresh_schema!
  end

  # The name of the primary key index on `qualified_table_name`, or nil if the
  # table has none. Resolved from the catalog rather than composed as
  # `<table>_pkey`, because PostgreSQL auto-disambiguates that name when it is
  # already taken: a table created while an earlier table's index still held the
  # name carries `<table>_pkey1` instead.
  def primary_key_index_name(qualified_table_name)
    connection = ActiveRecord::Base.connection
    connection.select_value(<<~SQL.squish)
      SELECT index_class.relname
      FROM pg_index
      JOIN pg_class index_class ON index_class.oid = pg_index.indexrelid
      WHERE pg_index.indrelid = #{connection.quote(connection.quote_table_name(qualified_table_name))}::regclass
        AND pg_index.indisprimary
    SQL
  end

  # PostgreSQL names the index behind a primary key `<table>_pkey` and leaves it
  # alone across a RENAME, so after a rename the index still carries the table's
  # former name — and the next table to take that name gets a disambiguated
  # `<table>_pkey1`. `connection.rename_table` would have fixed this, but
  # it resolves the index through the search path, and our table names are
  # schema-qualified, so it finds nothing and skips the step in silence.
  # Renaming into a name something else already holds is the same collision this
  # method exists to clean up, arriving from the other side: rename `b` to `c`,
  # then `a` to `b`, and `a`'s index wants a name `c`'s index is still sitting on.
  # PostgreSQL answers that with PG::DuplicateTable, raised from inside
  # `after_update :rename_table`, rolling back a rename that had already passed
  # validation. So the canonical name is taken only when it is free; otherwise the
  # index keeps whatever disambiguated name PostgreSQL gave it, which is untidy
  # but correct, and the next rename of the table holding it frees the name again.
  def rename_primary_key_index(previous_index_name)
    return if previous_index_name.blank?
    target = "#{identifier}_pkey"
    return if previous_index_name == target
    return if index_name_taken_in_schema?(target)
    connection = ActiveRecord::Base.connection
    connection.execute(<<~SQL.squish)
      ALTER INDEX #{connection.quote_table_name("#{schema_definition.schema_name}.#{previous_index_name}")}
      RENAME TO #{connection.quote_column_name(target)}
    SQL
  end

  def index_name_taken_in_schema?(index_name)
    connection = ActiveRecord::Base.connection
    connection.select_value(<<~SQL.squish).present?
      SELECT 1
      FROM pg_class index_class
      JOIN pg_namespace ON pg_namespace.oid = index_class.relnamespace
      WHERE pg_namespace.nspname = #{connection.quote(schema_definition.schema_name)}
        AND index_class.relname = #{connection.quote(index_name)}
        AND index_class.relkind IN ('i', 'I')
    SQL
  end

  def rename_table
    return unless identifier_previously_changed?
    previous_table_name = table_name_for(nil, identifier_previously_was)
    return if previous_table_name == table_name

    connection = ActiveRecord::Base.connection
    return if connection.table_exists?(table_name)
    return unless connection.table_exists?(previous_table_name)

    previous_index_name = primary_key_index_name(previous_table_name)

    connection.execute(<<~SQL.squish)
      ALTER TABLE #{connection.quote_table_name(previous_table_name)}
      RENAME TO #{connection.quote_column_name(identifier)}
    SQL
    rename_primary_key_index previous_index_name
    refresh_schema! previous_table_name
  end

  # Drop this table out of the pool-wide schema cache after a DDL statement, so
  # the next `record_klass` builds its attributes from the shape the table has
  # now. Called after every statement that changes the table.
  #
  # The adapter only does part of this by itself: `create_table`, `drop_table`
  # and `rename_table` clear the data-source cache, but `add_column`,
  # `rename_column`, `change_column` and `change_column_null` clear only the
  # prepared-statement cache, and `remove_column` clears nothing at all.
  #
  # Unconditional on purpose. The obvious alternative — finding the model that
  # owns the table and calling `reset_column_information` on it — cannot work
  # here: `record_klass` returns an anonymous class, `Class#subclasses` holds
  # only weak references, so once it has been collected the hunt matches nothing
  # and the cache is quietly left stale. Iterating descendants is unsafe
  # besides, since `table_name` raises on an anonymous subclass caught between
  # `inherited` and its `self.table_name=`.
  # `also` names further qualified table names to evict — the name the table is
  # moving away from, for the two renames. `ALTER TABLE ... RENAME` and
  # `ALTER SCHEMA ... RENAME` both go out through `execute`, so unlike
  # `connection.rename_table` nothing drops the old name by itself.
  def refresh_schema!(*also)
    connection = ActiveRecord::Base.connection
    pool = ActiveRecord::Base.connection_pool
    names = ([ table_name ] + also).compact.map(&:to_s).uniq

    # Straight away, because the rest of *this* transaction has to see the shape
    # the DDL just gave the table — `alter_column` builds a `record_klass` two
    # lines after calling here.
    #
    # `connection.clear_cache!` rather than `pool.active_connection&.clear_cache!`:
    # `active_connection` is an alias of `active_connection?`, which is
    # documented not to detect connections obtained through `checkout`, so the
    # `&.` can silently skip the clear on the very connection that just ran the
    # DDL. Every statement here goes through `ActiveRecord::Base.connection`, so
    # clear that one.
    connection.clear_cache!
    names.each { |name| pool.schema_cache.clear_data_source_cache!(name) }

    # And again if the transaction rolls back. Anything that repopulated the
    # cache in between — the `record_klass` above, a query from another callback
    # — describes a shape the database never kept, and `schema_cache` hangs off
    # the pool_config for the life of the process, shared by every thread. A
    # no-op outside a transaction: NullTransaction#after_rollback ignores the
    # block.
    transaction = connection.current_transaction
    unless transaction.state&.finalized?
      transaction.after_rollback do
        connection.clear_cache!
        names.each { |name| pool.schema_cache.clear_data_source_cache!(name) }
      end
    end
    nil
  end

  # Deliberately not memoised, however wasteful rebuilding the class per call
  # looks. Three things would go stale behind a memo, and only the first has any
  # DDL to hang an invalidation on:
  #
  #   - `SchemaDefinition#rename_schema` iterates its own `table_definitions`, so
  #     the `refresh_schema!` it calls lands on freshly loaded records, never on
  #     the definition a caller is holding. `reload` does not clear ivars, so that
  #     caller's memo would keep pointing at the schema the tables just left.
  #   - `alter_column` refreshes and *then* builds a class that repopulates the
  #     caches before it raises. The `after_rollback` hook in `refresh_schema!`
  #     evicts the pool's schema cache, but an anonymous class keeps its own
  #     `@columns_hash`, which nothing would evict.
  #   - `@column_definitions` below is a Relation, unloaded on each call as this
  #     stands. Held across calls it loads once, and a rename or a `sort` change on
  #     a column — neither of which runs any DDL — would leave `entity_properties`
  #     describing the definition as it was.
  def record_klass
    table_definition = self
    column_definitions = self.ordered_column_definitions
    klass = Class.new(ActiveRecord::Base) do
      self.table_name = table_definition.table_name
      @table_definition = table_definition
      @column_definitions = column_definitions
      before_save :set_updater

      def set_updater
        current_user_login = Grit::Core::User.current.login
        self.created_by = current_user_login if self.new_record?
        self.updated_by = current_user_login
      end

      def self.detailed(params = nil)
        quoted_table_name = @table_definition.quoted_table_name
        query = self.unscoped
          .select("#{quoted_table_name}.id")
          .select("#{quoted_table_name}.created_by")
          .select("#{quoted_table_name}.updated_by")
          .select("#{quoted_table_name}.created_at")
          .select("#{quoted_table_name}.updated_at")

        # Implementation columns are physically on the table but described
        # nowhere in `column_definitions`, so they have to be selected here or
        # they are invisible to the UI and `readable.rb` rejects any filter or
        # sort that names one.
        #
        # Every one of them, `presented_when` or not. The gate belongs to
        # `entity_properties` and the two methods built on it, which the
        # entities controller feeds keywords from `entity_args`; a scope reaches
        # here through `readable.rb`'s `klass.send(scope, params)`, one
        # positional argument, so there are no keywords to gate on. Gating on
        # what this can see would leave `entity_columns(with_x: true)`
        # advertising a column the payload does not carry, and a sort on it
        # resolves to `nil ASC NULLS LAST`. A payload wider than the columns
        # advertised is harmless by comparison — the grid ignores keys it was
        # not told about.
        @table_definition.implementation_column_definitions.each do |column|
          identifier = column[:identifier].to_s
          query = query.select("#{@table_definition.quoted_table_name}.#{ActiveRecord::Base.connection.quote_column_name(identifier)}")
          # An implementation column may be declared `type: "entity"`, in which
          # case `entity_columns` expands it into one `<name>__<display>` grid
          # column per display property — none of which exist unless the target
          # is joined here too.
          next unless column[:type].to_s == "entity" && column[:entity]
          entity_klass = column[:entity][:full_name].constantize
          # Joined on whatever the column's foreign key points at, not on `id`:
          # `implementation_column_target_column` supports `primary_key:`, and a
          # constraint named after another column has to be joined on that column
          # or the comparison is bigint against whatever the target actually is.
          query = select_entity_display_columns(query, identifier, entity_klass.table_name, entity_klass, @table_definition.implementation_column_target_column(column))
        end

        @column_definitions.each do |column|
          query = query.select("#{@table_definition.quoted_table_name}.#{column.quoted_identifier}")
          next unless column.data_type.is_entity
          query = select_entity_display_columns(query, column.identifier, column.data_type.table_name, column.data_type.model)
        end
        query
      end

      # Joins `target_table_name` on `<name>` and selects each of the target's
      # display properties as `<name>__<display property>` — the grid columns
      # `entity_columns_from_properties` expands an entity property into. Shared
      # by both loops above so that an implementation column declared as an
      # entity is selected exactly as a dynamic one is.
      #
      # `target_column` defaults to `id`, which is what every dynamic column's
      # foreign key points at (`create_dynamic_column_foreign_keys`); only an
      # implementation column can say otherwise.
      def self.select_entity_display_columns(query, name, target_table_name, entity_klass, target_column = DEFAULT_FOREIGN_KEY_TARGET_COLUMN)
        display_properties = entity_klass.display_properties
        return query if display_properties.nil?
        connection = ActiveRecord::Base.connection
        table_alias = "#{name}__entities"
        quoted_column = connection.quote_column_name(name)
        query = query.joins(<<~SQL.squish)
          LEFT OUTER JOIN #{connection.quote_table_name(target_table_name)} #{connection.quote_column_name(table_alias)}
          ON #{connection.quote_column_name(table_alias)}.#{connection.quote_column_name(target_column)} = #{@table_definition.quoted_table_name}.#{quoted_column}
        SQL
        display_properties.each do |display_property|
          query = query.select(
            "#{connection.quote_column_name(table_alias)}.#{connection.quote_column_name(display_property[:name])}" \
            " AS #{connection.quote_column_name("#{name}__#{display_property[:name]}")}"
          )
        end
        query
      end

      # Both of these live on the definition, so that an includer can override
      # them with `super`. See TableDefinition#implementation_column_properties.
      def self.implementation_column_properties(**args)
        @table_definition.implementation_column_properties(**args)
      end

      def self.read_only_property_names
        @table_definition.read_only_property_names
      end

      def self.column_definition_properties(**args)
        @column_definitions.map do |column_definition|
          property = {
            name: column_definition.identifier,
            display_name: column_definition.name,
            description: column_definition.description,
            type: column_definition.data_type.is_entity ? "entity" : column_definition.data_type.name,
            required: column_definition.required,
            unique: false,
            entity: column_definition.data_type.entity_definition
          }
          property
        end
      end

      def self.entity_properties(**args)
        props = [
          {
            display_name: "Created at",
            name: "created_at",
            type: "datetime"
          },
          {
            display_name: "Created by",
            name: "created_by",
            type: "string"
          },
          {
            display_name: "Updated at",
            name: "updated_at",
            type: "datetime"
          },
          {
            display_name: "Updated by",
            name: "updated_by",
            type: "string"
          } ]

        props.concat(self.implementation_column_properties(**args))
        props.concat(self.column_definition_properties(**args))
      end

      # `property[:entity]` is guarded rather than assumed, as it is in `detailed`:
      # an implementation column may be declared `type: "entity"` with no `entity:`
      # hash. `implementation_column_definitions_valid` refuses that shape, but an
      # includer overriding `implementation_column_properties` reaches here
      # without passing through it, and the failure — a NoMethodError on every
      # index request, while `detailed` keeps working — is a poor way to find out.
      def self.entity_field_from_property(property)
        if property[:type] == "entity" && property[:entity]
          foreign_klass = property[:entity][:full_name].constantize
          foreign_klass_property = foreign_klass.display_properties[0]
          unless foreign_klass_property.nil?
            {
              **property,
              entity: {
                **property[:entity],
                column: property[:name],
                display_column: foreign_klass_property[:name],
                display_column_type: foreign_klass_property[:type]
              }
            }
          else
            {
              **property,
              entity: {
                **property[:entity],
                column: property[:name],
                display_column: property[:entity][:primary_key],
                display_column_type: property[:entity][:primary_key_type]
              }
            }
          end
        else
          property
        end
      end

      def self.entity_fields_from_properties(properties)
        read_only = self.read_only_property_names
        properties.each_with_object([]) do |property, memo|
          next if read_only.include?(property[:name])
          memo.push(entity_field_from_property(property))
        end
      end

      def self.entity_columns_from_properties(properties, default_hidden = Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS)
        properties.each_with_object([]) do |property, memo|
          # Guarded for the same reason as `entity_field_from_property` above.
          if property[:type] == "entity" && property[:entity]
            foreign_klass = property[:entity][:full_name].constantize
            foreign_klass_display_properties = foreign_klass.display_properties
            foreign_klass_display_properties.each do |foreign_klass_display_property|
              memo.push({
                **property,
                display_name: foreign_klass_display_properties.length > 1 ? "#{property[:display_name]} #{foreign_klass_display_property[:display_name]}" : property[:display_name],
                name: "#{property[:name]}__#{foreign_klass_display_property[:name]}",
                entity: {
                  **property[:entity],
                  column: property[:name],
                  display_column: foreign_klass_display_property[:name],
                  display_column_type: foreign_klass_display_property[:type]
                },
                # The property's own flag counts too, exactly as in the else
                # branch below: a column declared `default_hidden: true` should
                # not become visible just because it is an entity reference.
                default_hidden: property[:default_hidden] ||
                  default_hidden.include?("#{property[:name]}__#{foreign_klass_display_property[:name]}")
              })
            end
          else
            memo.push({
              **property,
              default_hidden: property[:default_hidden] || default_hidden.include?(property[:name])
            })
          end
        end
      end

      def self.entity_fields(**args)
        self.entity_fields_from_properties(self.entity_properties(**args))
      end

      def self.entity_columns(**args)
        self.entity_columns_from_properties(self.entity_properties(**args))
      end
    end
    klass
  end

  class_methods do
    def has_many_column_definitions(column_definitions_association)
      self.column_definitions_association = column_definitions_association
      has_many self.column_definitions_association, dependent: :delete_all
    end

    def belongs_to_schema_definition(schema_definition_association)
      self.schema_definition_association = schema_definition_association
      belongs_to self.schema_definition_association
    end

    def schema_definition_id
      "#{self.schema_definition_association}_id".to_sym
    end
  end
end
