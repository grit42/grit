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
  IMPLEMENTATION_COLUMN_TYPES = {
    "bigint" => "integer",
    "varchar" => "string",
    "timestamp without time zone" => "datetime"
  }.freeze

  # Only class-level declarations belong in `included do`. Instance methods stay
  # in the module body so that an includer can override any of them and call
  # `super`; a `def` inside `included do` is defined directly on the includer,
  # which puts it out of reach of `super` and silently wins over anything the
  # includer declares.
  #
  # Note that module-level definitions are *not* enough on their own to keep
  # `column_definitions` from recursing when an includer names its association
  # `column_definitions` too: ActiveRecord includes `GeneratedAssociationMethods`
  # from `inherited`, i.e. before the class body runs, so this module still sits
  # above it in the ancestor chain and shadows the generated reader. The
  # accessors below therefore go through `association(...).reader` — the same
  # thing the generated reader does — rather than `send`, which would dispatch
  # straight back here.
  included do
    class_attribute :column_definitions_association, default: nil
    class_attribute :schema_definition_association, default: nil

    before_save :check_can_modify
    after_create :create_table, if: :create_table_on_create?
    after_update :rename_table
    before_destroy :check_can_modify
    after_destroy :drop_table

    validate :implementation_column_identifiers_within_budget
    validate :identifier_unique_in_schema
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

  # The schema-qualified name a given pair of names composes to. Both default to
  # what this definition currently carries, so `table_name_for` with no arguments
  # is `table_name`; `rename_table` uses it to name the table this definition used
  # to have, and `SchemaDefinition#rename_schema` to name it under the schema the
  # table used to live in.
  #
  # Qualified rather than prefixed: the schema is what separates one definition's
  # tables from another's now, so the table itself is named after nothing but its
  # own identifier and gets PostgreSQL's full 63 bytes to do it in.
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

  # Two definitions resolving to one table would silently share a physical table
  # and its rows, and `after_destroy :drop_table` on either would take the other's
  # data with it, with no error anywhere. That is also what makes `create_table`'s
  # `if_not_exists: true` safe: once no two rows can claim one name, "the table is
  # already there" can only mean "mine, already created".
  #
  # A plain scoped check is all that takes now that the schema does the
  # separating. While table names were composed by concatenation this could not
  # be one — identifiers may contain underscores, so schema "gr" + table "p_tbl"
  # and schema "gr_p" + table "tbl" were two valid rows naming one table, and the
  # check had to compare the joined string across the association. Inside a schema
  # a table is named after its own identifier and nothing else, so two rows
  # collide exactly when that identifier repeats.
  #
  # An includer should still add a unique index on `[<schema>_id, identifier]` to
  # close the concurrent-create race; this validation is what turns it into an
  # error message rather than a RecordNotUnique.
  #
  # Written out rather than `validates :identifier, uniqueness: { scope: ... }`
  # because the scope column is only known once the includer has called
  # `belongs_to_schema_definition`, which happens after this module is included.
  #
  # Scoped to `base_class`, i.e. to every row in the includer's definition table.
  def identifier_unique_in_schema
    return if self.class.schema_definition_association.nil?
    return if identifier.blank?
    foreign_key = self.class.schema_definition_id
    return if self[foreign_key].blank?
    return unless new_record? || identifier_changed? || attribute_changed?(foreign_key)
    klass = self.class.base_class
    scope = klass.unscoped.where(foreign_key => self[foreign_key], identifier: identifier)
    scope = scope.where.not(id: id) if persisted?
    return unless scope.exists?
    errors.add(:identifier, "is already taken: another definition resolves to the table #{table_name}")
  end

  # Column definitions in a stable order. The association itself carries none,
  # so every read is at the mercy of whatever order PostgreSQL happens to
  # return heap rows in — and an UPDATE rewrites a row in place, moving it — so
  # without this the grid's columns reshuffle between requests as soon as a
  # definition is edited.
  #
  # Ordered by `sort` when the includer's column-definition table has such a
  # column, nulls last so that an unsorted definition falls to the end rather
  # than to the front, then by id to break ties. `sort` is a convention, not a
  # requirement, hence the check.
  # `includes(:data_type)` because every caller reads `data_type` off each row —
  # `create_dynamic_columns` for its `sql_name`, `record_klass` for its
  # `entity_definition` — and `.order` on the association proxy builds a fresh
  # Relation, so nothing is preloaded for it.
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
  # database without passing through any of the `identifier` validations, so its
  # identifiers are checked here instead — against the same rules, and against
  # the same byte budget the schema prefix is held to.
  def implementation_column_identifiers_within_budget
    seen = []
    implementation_column_definitions.each do |column|
      identifier = column[:identifier].to_s
      if identifier.empty?
        errors.add(:base, "An implementation column is missing an identifier")
      elsif !IDENTIFIER_FORMAT.match?(identifier)
        errors.add(:base, "Implementation column #{identifier.inspect} should start with two lowercase letters or underscores and contain only lowercase letters, numbers and underscores")
      elsif identifier.bytesize > MAX_IDENTIFIER_LENGTH
        errors.add(:base, "Implementation column #{identifier.inspect} is #{identifier.bytesize} bytes; at most #{MAX_IDENTIFIER_LENGTH}")
      # The two below would otherwise surface as a PG::DuplicateColumn raised
      # from inside `after_create :create_table`, leaving a definition row behind
      # with no table.
      elsif Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS.include?(identifier)
        errors.add(:base, "Implementation column #{identifier.inspect} is a base column of every dynamic table")
      elsif seen.include?(identifier)
        errors.add(:base, "Implementation column #{identifier.inspect} is declared more than once")
      else
        seen.push(identifier)
      end
    end
  end

  # Whether creating the definition should materialise its table straight away.
  # True by default; override to return false and call `create_table` yourself
  # (or `SchemaDefinition#create_tables`) at whatever point the schema is
  # considered settled, e.g. a publish step.
  def create_table_on_create?
    true
  end

  # Idempotent: an existing table, or a foreign key that is already there, is a
  # no-op rather than an error, so callers — `SchemaDefinition#create_tables`
  # above all — need not track what has already been materialised. Note that
  # CREATE TABLE IF NOT EXISTS skips the block along with the table, so this
  # does not backfill columns onto a table that already exists; it does not
  # need to, since `ColumnDefinition#create_column` adds each one as soon as
  # the table is there.
  def create_table
    connection = ActiveRecord::Base.connection
    columns = ordered_column_definitions.to_a
    ActiveRecord::Base.transaction do
      # Idempotent too, so a definition whose creation was deferred past its
      # schema's — or one that predates this scheme — still materialises.
      schema_definition.create_schema
      # `_uses_legacy_table_name: true` skips exactly one check, and only that
      # one: `validate_table_length!`, which measures the whole `<schema>.<table>`
      # string — dot and schema included — against PostgreSQL's *per identifier*
      # limit. That check is incidental rather than principled. It exists to catch
      # names from which PostgreSQL and Rails go on to derive further identifiers
      # (`<table>_pkey`, `<table>_<pk>_seq`, `index_<table>_on_<cols>`), and that
      # derivation uses the unqualified name; PostgreSQL caps each identifier
      # separately, so a qualified name may legally reach 127 bytes, and no other
      # DDL helper validates it at all. Rails whitelists this option in
      # `validate_create_table_options!` as the opt-out.
      connection.create_table table_name, id: false, if_not_exists: true, _uses_legacy_table_name: true do |t|
        create_base_columns t
        create_implementation_columns t
        create_dynamic_columns t, columns
      end
      create_foreign_keys columns
    end
    refresh_schema!
  end

  # The columns every dynamic table has. These are the names
  # `ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS` lists, which is what keeps a
  # dynamic column from taking one and what `read_only_property_names` and
  # `entity_columns_from_properties` both default to — add a column here and it
  # has to be added there.
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

  # `primary_key:` is passed even where it is the default, so that the constraint
  # and the name it is given can never disagree about what it points at.
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

  # The name a foreign-key constraint on `column_identifier` should have: the
  # column, and the column it points at. Nothing about the table or the schema is
  # baked in, which is what lets a table rename and a schema rename leave every
  # constraint on the table exactly as it found them.
  #
  # PostgreSQL truncates over-long identifiers silently at parse time, which would
  # let two columns share one constraint, so refuse to write a name that would not
  # survive the trip. This is also the only place the two identifiers still meet,
  # and so what sets MAX_IDENTIFIER_LENGTH: 30 + 1 + 30 = 61.
  def foreign_key_name(column_identifier, target_column = DEFAULT_FOREIGN_KEY_TARGET_COLUMN)
    name = "#{column_identifier}_#{target_column}"
    limit = ActiveRecord::Base.connection.max_identifier_length
    raise ArgumentError, "Foreign key name #{name.inspect} is #{name.bytesize} bytes; PostgreSQL truncates at #{limit}" if name.bytesize > limit
    name
  end

  # The constraint currently on `column_identifier`, whatever it happens to be
  # called. `connection.foreign_keys` reads pg_constraint and resolves columns
  # live through conkey -> pg_attribute, so `fk.column` always reflects the
  # current column name and follows a RENAME COLUMN by itself; `fk.name` does
  # not, which is exactly why the name has to be looked up rather than computed
  # from what the column used to be called.
  def foreign_key_for_column(column_identifier)
    ActiveRecord::Base.connection.foreign_keys(table_name)
      .find { |fk| Array(fk.column).map(&:to_s) == [ column_identifier.to_s ] }
  end

  def rename_foreign_key(from_name, to_name)
    return to_name if from_name == to_name
    connection = ActiveRecord::Base.connection
    # There is no rename_constraint in the adapter API, and RENAME CONSTRAINT
    # has no IF EXISTS — hence the lookup above. quote_column_name, not
    # quote_table_name: the latter splits the name on ".".
    connection.execute(<<~SQL.squish)
      ALTER TABLE #{connection.quote_table_name(table_name)}
      RENAME CONSTRAINT #{connection.quote_column_name(from_name)}
                     TO #{connection.quote_column_name(to_name)}
    SQL
    to_name
  end

  # `foreign_key.primary_key` rather than the default, so that a constraint
  # pointing at something other than `id` is renamed to a name that still
  # describes it.
  #
  # No staging pass, unlike the table-wide re-canonicalisation this replaced: only
  # one constraint moves, and its target name `<new column>_<target>` could only
  # be taken by a constraint on a column already called `<new column>` — which
  # cannot exist, since the column rename would have failed first. Were two names
  # to collide anyway, RENAME CONSTRAINT raises rather than corrupting anything.
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
  # `<table>_pkey1`. `connection.rename_table` would have fixed this for us, but
  # it resolves the index through the search path, and our table names are
  # schema-qualified, so it finds nothing and skips the step in silence.
  def rename_primary_key_index(previous_index_name)
    return if previous_index_name.blank?
    target = "#{identifier}_pkey"
    return if previous_index_name == target
    connection = ActiveRecord::Base.connection
    connection.execute(<<~SQL.squish)
      ALTER INDEX #{connection.quote_table_name("#{schema_definition.schema_name}.#{previous_index_name}")}
      RENAME TO #{connection.quote_column_name(target)}
    SQL
  end

  # Only the table's own identifier can move it now: a schema rename moves every
  # table in the schema in one statement, from `SchemaDefinition#rename_schema`,
  # and leaves their names alone. Constraint names embed neither the schema nor
  # the table, so nothing here has to re-canonicalise them either.
  #
  # Hand-rolled rather than `connection.rename_table`, which builds
  # `ALTER TABLE <old> RENAME TO <new>` from two names it quotes the same way —
  # and `RENAME TO` takes a bare name, so the new one cannot be qualified. Once
  # it is not, the adapter's own primary-key index fix-up stops resolving; see
  # `rename_primary_key_index`.
  def rename_table
    return unless identifier_previously_changed?
    previous_table_name = table_name_for(nil, identifier_previously_was)
    return if previous_table_name == table_name

    connection = ActiveRecord::Base.connection
    # Already moved. Reading "the target name exists" as "my table is already
    # there" is only sound because no two definitions may resolve to one table
    # name; see `identifier_unique_in_schema`.
    return if connection.table_exists?(table_name)
    # Under neither name: the table was never materialised — `create_table` was
    # deferred by `create_table_on_create?`, or the definition predates its table.
    # `create_table` will build it under the new name.
    return unless connection.table_exists?(previous_table_name)

    # Read while the old name still resolves.
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
        @table_definition.implementation_column_definitions.each do |column|
          identifier = column[:identifier].to_s
          query = query.select("#{@table_definition.quoted_table_name}.#{ActiveRecord::Base.connection.quote_column_name(identifier)}")
          # An implementation column may be declared `type: "entity"`, in which
          # case `entity_columns` expands it into one `<name>__<display>` grid
          # column per display property — none of which exist unless the target
          # is joined here too.
          next unless column[:type].to_s == "entity" && column[:entity]
          entity_klass = column[:entity][:full_name].constantize
          query = select_entity_display_columns(query, identifier, entity_klass.table_name, entity_klass)
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
      def self.select_entity_display_columns(query, name, target_table_name, entity_klass)
        display_properties = entity_klass.display_properties
        return query if display_properties.nil?
        connection = ActiveRecord::Base.connection
        table_alias = "#{name}__entities"
        quoted_column = connection.quote_column_name(name)
        query = query.joins(<<~SQL.squish)
          LEFT OUTER JOIN #{connection.quote_table_name(target_table_name)} #{connection.quote_column_name(table_alias)}
          ON #{connection.quote_column_name(table_alias)}.id = #{@table_definition.quoted_table_name}.#{quoted_column}
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

      def self.entity_field_from_property(property)
        if property[:type] == "entity"
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
          if property[:type] == "entity"
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
      has_many self.column_definitions_association, dependent: :destroy
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
