# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

# Tests for the DynamicSchema::TableDefinition concern, exercised through the
# Grit::TableDefinition dummy model. These go all the way to real DDL: the
# dummy tables are created and dropped for real, and PostgreSQL's transactional
# DDL plus `use_transactional_fixtures` rolls them back per example.
RSpec.describe "DynamicSchema::TableDefinition concern", type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:schema) { Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema") }
  let(:string_type) { create(:grit_core_data_type, :string) }
  let(:entity_type) { create(:grit_core_data_type, :entity) }

  before(:each) do
    set_current_user(admin)
  end

  def connection
    ActiveRecord::Base.connection
  end

  def foreign_key_names(table_name)
    connection.foreign_keys(table_name).map(&:name).sort
  end

  def primary_key_index_name(table_name)
    connection.select_value(<<~SQL.squish)
      SELECT index_class.relname
      FROM pg_index
      JOIN pg_class index_class ON index_class.oid = pg_index.indexrelid
      WHERE pg_index.indrelid = #{connection.quote(connection.quote_table_name(table_name))}::regclass
        AND pg_index.indisprimary
    SQL
  end

  # T1 — instance methods live in the module body, so an includer can name its
  # associations `column_definitions` / `schema_definition` (the concern's own
  # accessor names) without the accessors recursing into themselves.
  describe "natural-name associations (T1)" do
    it "reads the associations rather than recursing" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(table.schema_definition).to eq(schema)
      expect(table.column_definitions.to_a).to eq([])
    end

    it "composes table_name from both associations" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(table.table_name).to eq("test_grp.tbl")
    end
  end

  # T2 — check_can_modify is a no-op by default, and overridable via `super`.
  describe "check_can_modify default guard (T2)" do
    it "allows create, update and destroy" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(table.update(name: "Renamed")).to be(true)
      expect { table.destroy! }.not_to raise_error
    end

    it "is overridable with super" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "OverridingTableDefinition"

        def check_can_modify
          super
          raise "locked"
        end
      end

      expect { klass.create!(identifier: "tbl", name: "Table", schema_definition: schema) }
        .to raise_error("locked")
    end
  end

  # T3 — implementation_column_definitions defaults to [], so a plain includer
  # that never declares one can still create its table.
  describe "implementation_column_definitions default (T3)" do
    it "defaults to an empty array" do
      klass = Class.new(ApplicationRecord) do
        def self.name = "Grit::PlainTableDefinition"
        self.table_name = "test_table_definitions"
        include Grit::Core::Model::DynamicSchema::TableDefinition
        # Hand-rolled rather than `has_many_column_definitions`, only because
        # the anonymous class's name gives Rails the wrong foreign key.
        self.column_definitions_association = :column_definitions
        has_many :column_definitions, class_name: "Grit::ColumnDefinition", foreign_key: :table_definition_id
        belongs_to_schema_definition :schema_definition
      end

      table = klass.create!(identifier: "pln", name: "Plain", schema_definition: schema)
      expect(table.implementation_column_definitions).to eq([])
      expect(connection.table_exists?("test_grp.pln")).to be(true)
    end
  end

  # ==========================================================================
  # T5 — create_table idempotency and create_table_on_create?
  # ==========================================================================

  describe "create_table idempotency and timing (T5)" do
    it "materialises the table on create by default" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(connection.table_exists?(table.table_name)).to be(true)
    end

    it "is a no-op rather than an error when the table already exists" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect { table.create_table }.not_to raise_error
      expect(connection.table_exists?(table.table_name)).to be(true)
    end

    it "does not duplicate foreign keys when re-run" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      before = foreign_key_names(table.table_name)

      table.create_table

      expect(foreign_key_names(table.table_name)).to eq(before)
    end

    it "lets SchemaDefinition#create_tables run over already-created tables" do
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)
      Grit::TableDefinition.create!(identifier: "two", name: "Two", schema_definition: schema)

      expect { schema.create_tables }.not_to raise_error
      expect(connection.table_exists?("test_grp.one")).to be(true)
      expect(connection.table_exists?("test_grp.two")).to be(true)
    end

    it "defers creation when create_table_on_create? is overridden to false" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "DeferredTableDefinition"

        def create_table_on_create?
          false
        end
      end

      table = klass.create!(identifier: "dfr", name: "Deferred", schema_definition: schema)
      expect(connection.table_exists?(table.table_name)).to be(false)

      table.create_table
      expect(connection.table_exists?(table.table_name)).to be(true)
    end
  end

  # ==========================================================================
  # T15 — one definition per physical table name
  # ==========================================================================

  # What makes `create_table`'s `if_not_exists: true` safe. Without these, two
  # definitions resolving to one name silently share a physical table and its
  # rows, and `after_destroy :drop_table` on either takes the other's data with
  # it, with no error anywhere.
  describe "unique table names (T15)" do
    it "rejects a duplicate identifier within one schema, leaving the first table alone" do
      Grit::TableDefinition.create!(identifier: "tbl", name: "One", schema_definition: schema)

      clash = Grit::TableDefinition.new(identifier: "tbl", name: "Two", schema_definition: schema)

      expect(clash).not_to be_valid
      expect(connection.table_exists?("test_grp.tbl")).to be(true)
    end

    it "allows the same table identifier under differently named schemas" do
      other_schema = Grit::SchemaDefinition.create!(identifier: "other", name: "Other")
      Grit::TableDefinition.create!(identifier: "tbl", name: "One", schema_definition: schema)

      expect(Grit::TableDefinition.new(identifier: "tbl", name: "Two", schema_definition: other_schema)).to be_valid
    end

    # The whole point of moving to schemas. Under the old prefix scheme these two
    # shared one physical table, and this was the case the validation could only
    # catch by comparing composed names across the association: identifiers may
    # contain underscores, so schema "gr" + table "p_tbl" and schema "gr_p" +
    # table "tbl" both named `test_gr_p_tbl`. Qualified, they are
    # `test_gr.p_tbl` and `test_gr_p.tbl`, which cannot be confused.
    it "keeps identifiers that would once have concatenated onto one name apart" do
      first_schema = Grit::SchemaDefinition.create!(identifier: "gr", name: "Schema")
      second_schema = Grit::SchemaDefinition.create!(identifier: "gr_p", name: "Schema P")

      first = Grit::TableDefinition.create!(identifier: "p_tbl", name: "One", schema_definition: first_schema)
      second = Grit::TableDefinition.create!(identifier: "tbl", name: "Two", schema_definition: second_schema)

      expect(first.table_name).to eq("test_gr.p_tbl")
      expect(second.table_name).to eq("test_gr_p.tbl")
      expect(connection.table_exists?(first.table_name)).to be(true)
      expect(connection.table_exists?(second.table_name)).to be(true)
    end

    it "lets a definition be updated without colliding with itself" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      expect { table.update!(name: "Renamed") }.not_to raise_error
    end
  end

  # ==========================================================================
  # T6 — rename_table guard
  # ==========================================================================

  describe "rename_table (T6)" do
    it "renames the table when it exists" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      table.update!(identifier: "new_tbl")

      expect(connection.table_exists?("test_grp.tbl")).to be(false)
      expect(connection.table_exists?("test_grp.new_tbl")).to be(true)
    end

    it "renames every table in the schema when the schema identifier changes" do
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)
      Grit::TableDefinition.create!(identifier: "two", name: "Two", schema_definition: schema)

      schema.update!(identifier: "new_grp")

      expect(connection.table_exists?("test_new_grp.one")).to be(true)
      expect(connection.table_exists?("test_new_grp.two")).to be(true)
    end

    it "is a no-op when the table was never materialised" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "UnmaterialisedTableDefinition"

        def create_table_on_create?
          false
        end
      end

      table = klass.create!(identifier: "dfr", name: "Deferred", schema_definition: schema)
      expect(connection.table_exists?(table.table_name)).to be(false)

      expect { table.update!(identifier: "new_dfr") }.not_to raise_error
      expect(table.reload.identifier).to eq("new_dfr")
    end

    # The two renames are independent now — the table moves within its schema,
    # the schema moves with every table in it — but they still have to compose.
    # The schema has to hold the very instance that did the first rename, which is
    # what `accepts_nested_attributes_for :table_definitions` gives you when both
    # are renamed in one save. `.load` would not do: it builds its own copy, whose
    # `identifier` is stale and whose `identifier_previously_was` never saw the
    # rename at all.
    it "finds the table when the schema and the table are both renamed" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      schema.association(:table_definitions).target = [ table ]

      table.update!(identifier: "new_tbl")
      schema.update!(identifier: "new_grp")

      expect(connection.table_exists?("test_new_grp.new_tbl")).to be(true)
      expect(connection.table_exists?("test_grp.new_tbl")).to be(false)
      expect(table.reload.record_klass.count).to eq(0)
    end

    # PostgreSQL names a primary key's index after the table and then leaves it
    # alone across RENAME. `connection.rename_table` would have fixed that, but
    # it resolves the index through the search path and finds nothing for a
    # schema-qualified name, which is why the concern does it itself.
    it "carries the primary key index to the new name" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(primary_key_index_name("test_grp.tbl")).to eq("tbl_pkey")

      table.update!(identifier: "new_tbl")

      expect(primary_key_index_name("test_grp.new_tbl")).to eq("new_tbl_pkey")
    end

    # A constraint is named after its column and the column it references, so a
    # table rename has nothing to re-canonicalise — the whole two-phase staging
    # dance this replaced is gone.
    it "leaves constraint names untouched" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)

      table.update!(identifier: "new_tbl")

      expect(foreign_key_names("test_grp.new_tbl")).to eq([ "owner_id_id", "ref_col_id" ])
    end

    it "is idempotent" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      table.update!(identifier: "new_tbl")

      expect { table.rename_table }.not_to raise_error
      expect(connection.table_exists?("test_grp.new_tbl")).to be(true)
    end
  end

  # ==========================================================================
  # T7 — schema cache invalidation
  # ==========================================================================

  describe "schema cache invalidation (T7)" do
    # Warms the pool-wide schema cache *without* leaving a live model behind
    # that names the table. That is the state the old descendants-hunt could not
    # cope with: `record_klass` returns an anonymous class, `Class#subclasses`
    # holds only weak references, so once it has been collected nothing in
    # `ActiveRecord::Base.descendants` matches the table, `&.` short-circuits,
    # and the warm cache is quietly left stale. Reaching for the cache directly
    # reproduces that deterministically, without waiting on a GC.
    def warm_schema_cache(table_name)
      ActiveRecord::Base.connection_pool.schema_cache.columns(table_name).map(&:name)
    end

    # Every example below gets its own table identifier, so that an anonymous
    # `record_klass` left over from another example — they are only weakly
    # referenced, not promptly collected — cannot happen to name this table and
    # mask the staleness.
    it "sees a column added after the cache was warmed" do
      table = Grit::TableDefinition.create!(identifier: "t_added", name: "Table", schema_definition: schema)
      expect(warm_schema_cache(table.table_name)).not_to include("late_col")

      Grit::ColumnDefinition.create!(identifier: "late_col", name: "Late", data_type: string_type, table_definition: table)

      expect(table.record_klass.column_names).to include("late_col")
    end

    it "sees a column rename without a manual reset_column_information" do
      table = Grit::TableDefinition.create!(identifier: "t_renamed", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "old_col", name: "Old", data_type: string_type, table_definition: table)
      expect(warm_schema_cache(table.table_name)).to include("old_col")

      column.update!(identifier: "new_col")

      expect(table.record_klass.column_names).to include("new_col")
      expect(table.record_klass.column_names).not_to include("old_col")
    end

    # `alter_column` renames, refreshes, then builds a `record_klass` to count
    # NULLs — which repopulates the cache with the post-rename shape — and only
    # then raises. The DDL rolls back; the cache entry would not, and
    # `schema_cache` hangs off the pool_config for the life of the process,
    # shared by every thread.
    it "does not keep a rolled-back rename in the cache" do
      table = Grit::TableDefinition.create!(identifier: "t_undone", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "old_col", name: "Old", data_type: string_type, table_definition: table)
      table.record_klass.create!
      expect(warm_schema_cache(table.table_name)).to include("old_col")

      expect {
        column.update!(identifier: "new_col", required: true)
      }.to raise_error(/Cannot require column with empty values/)

      expect(table.record_klass.column_names).to include("old_col")
      expect(table.record_klass.column_names).not_to include("new_col")
    end

    it "sees a null constraint change" do
      table = Grit::TableDefinition.create!(identifier: "t_nulled", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "some_col", name: "Some", data_type: string_type, table_definition: table)
      expect(warm_schema_cache(table.table_name)).to include("some_col")

      column.update!(required: true)

      expect(table.record_klass.columns_hash["some_col"].null).to be(false)
    end

    it "sees a dropped column" do
      table = Grit::TableDefinition.create!(identifier: "t_dropped", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "gone_col", name: "Gone", data_type: string_type, table_definition: table)
      expect(warm_schema_cache(table.table_name)).to include("gone_col")

      column.destroy!

      expect(table.record_klass.column_names).not_to include("gone_col")
    end

    # A table rename is the one case the adapter already handles by itself —
    # `PostgreSQLAdapter#rename_table` clears the data-source cache for both the
    # old and the new name. Asserted so that a change of adapter behaviour does
    # not go unnoticed.
    it "sees a table rename" do
      table = Grit::TableDefinition.create!(identifier: "t_moved", name: "Table", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "some_col", name: "Some", data_type: string_type, table_definition: table)
      warm_schema_cache(table.table_name)

      table.update!(identifier: "t_moved_to")

      expect(table.record_klass.table_name).to eq("test_grp.t_moved_to")
      expect(table.record_klass.column_names).to include("some_col")
    end
  end

  # ==========================================================================
  # T8 — foreign key constraint naming
  # ==========================================================================

  describe "foreign key constraint naming (T8)" do
    it "names constraints after the column and the column it references" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)

      expect(foreign_key_names(table.table_name)).to eq([ "owner_id_id", "ref_col_id" ])
    end

    it "re-canonicalises constraint names after a column rename" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)

      column.update!(identifier: "new_col")

      expect(foreign_key_names(table.table_name)).to eq([ "new_col_id", "owner_id_id" ])
    end

    it "frees the old name for reuse by a new column" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      column.update!(identifier: "new_col")

      expect {
        Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Reused", data_type: entity_type, table_definition: table)
      }.not_to raise_error

      expect(foreign_key_names(table.table_name))
        .to eq([ "new_col_id", "owner_id_id", "ref_col_id" ])
    end

    # A constraint name is the column and the column it points at, nothing else,
    # so neither rename below has anything to re-canonicalise. The three
    # expectations that follow are what makes the two-phase staging rename this
    # replaced unnecessary.
    it "keeps a renamed column's constraint across a table rename" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      column.update!(identifier: "new_col")

      table.update!(identifier: "new_tbl")

      expect(foreign_key_names("test_grp.new_tbl"))
        .to eq([ "new_col_id", "owner_id_id" ])
    end

    it "leaves constraint names alone when the schema identifier changes" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)

      schema.update!(identifier: "new_grp")

      expect(foreign_key_names("test_new_grp.tbl"))
        .to eq([ "owner_id_id", "ref_col_id" ])
    end

    # `col` and `x_col` used to compose constraint names that traded places on a
    # table rename — `col`'s target after renaming `tbl` to `tbl_x` was exactly
    # what `x_col`'s constraint was still called — which is what forced the
    # two-phase rename. Pinned so the collision cannot come back.
    it "leaves constraints on underscored column names alone across a table rename" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "col", name: "Col", data_type: entity_type, table_definition: table)
      Grit::ColumnDefinition.create!(identifier: "x_col", name: "X Col", data_type: entity_type, table_definition: table)

      expect { table.update!(identifier: "tbl_x") }.not_to raise_error

      expect(foreign_key_names("test_grp.tbl_x")).to eq(
        [ "col_id", "owner_id_id", "x_col_id" ]
      )
    end

    it "leaves a composite constraint alone" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      # Added out of band: nothing in the concern builds a composite key, and it
      # has no single column to be named after.
      connection.execute(%(ALTER TABLE "test_grp"."tbl" ADD CONSTRAINT "hand_written_pair" UNIQUE (id, created_by)))
      connection.execute(<<~SQL.squish)
        ALTER TABLE "test_grp"."tbl" ADD CONSTRAINT "hand_written_composite"
        FOREIGN KEY (id, created_by) REFERENCES "test_grp"."tbl" (id, created_by)
      SQL

      expect { table.update!(identifier: "new_tbl") }.not_to raise_error

      expect(foreign_key_names("test_grp.new_tbl")).to eq(
        [ "hand_written_composite", "owner_id_id" ]
      )
    end

    it "is safe to re-canonicalise a constraint that is already correct" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      before = foreign_key_names(table.table_name)

      table.rename_foreign_key_for_column("ref_col")

      expect(foreign_key_names(table.table_name)).to eq(before)
    end

    # A foreign key pointing somewhere other than `id` is named after that column,
    # so the name still describes what the constraint does.
    it "names a constraint after a non-default target column" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "AlternateTargetTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner_login", data_type_name: "character varying",
              foreign_key: { table_name: "grit_core_users", primary_key: "login" } } ]
        end
      end

      table = klass.create!(identifier: "alt", name: "Alt", schema_definition: schema)

      expect(foreign_key_names(table.table_name)).to eq([ "owner_login_login" ])
    end
  end

  # ==========================================================================
  # T9 — identifier byte budget
  # ==========================================================================

  describe "identifier byte budget (T9)" do
    it "invalidates a record whose implementation column identifier is malformed" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "BadImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "Owner-Id", data_type_name: "bigint" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/lowercase letters/)
    end

    it "invalidates a record whose implementation column identifier is over-long" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "LongImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "o" * (Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH + 1), data_type_name: "bigint" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/at most 30/)
    end

    it "invalidates a record whose implementation column takes a base column name" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "BaseNameImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "created_at", data_type_name: "timestamp without time zone" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/base column of every dynamic table/)
    end

    it "invalidates a record that declares one implementation column twice" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "DuplicateImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner_id", data_type_name: "bigint" },
            { identifier: "owner_id", data_type_name: "bigint" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/declared more than once/)
    end

    it "refuses to write a foreign key name PostgreSQL would truncate" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect { table.foreign_key_name("c" * 62) }.to raise_error(ArgumentError, /truncates at/)
    end

    # The arithmetic behind MAX_IDENTIFIER_LENGTH. A constraint name is the only
    # place two identifiers still meet, so 30 + 1 + 30 is what has to land inside
    # PostgreSQL's 63 byte limit. If it ever drifts, the tests below fail by
    # finding a truncated name — which is how two columns would come to share one
    # constraint.
    it "composes a worst-case constraint name inside the limit" do
      max = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      name = table.foreign_key_name("c" * max, "t" * max)

      expect(name.bytesize).to eq(61)
      expect(name.bytesize).to be <= connection.max_identifier_length
    end

    # And the whole way down: maximum identifiers at all three levels materialise,
    # and the constraint reaches the catalog whole. The qualified table name here
    # is 66 characters, past the combined length Rails checks for and well inside
    # what PostgreSQL actually allows — which is what `_uses_legacy_table_name`
    # buys, so this is also the test that pins that option in place.
    it "writes a worst-case constraint name whole" do
      max = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
      widest_schema = Grit::SchemaDefinition.create!(identifier: "g" * max, name: "Schema")
      table = Grit::TableDefinition.create!(identifier: "t" * max, name: "Table", schema_definition: widest_schema)
      Grit::ColumnDefinition.create!(identifier: "c" * max, name: "Ref", data_type: entity_type, table_definition: table)

      expect(table.table_name).to eq("test_#{'g' * max}.#{'t' * max}")
      expect(table.table_name.length).to be > connection.max_identifier_length
      expect(connection.table_exists?(table.table_name)).to be(true)
      expect(foreign_key_names(table.table_name)).to eq([ "#{'c' * max}_id", "owner_id_id" ])
    end
  end

  # ==========================================================================
  # T12 — implementation columns are visible
  # ==========================================================================

  describe "implementation columns in detailed and entity_properties (T12)" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    it "creates the column and its foreign key" do
      expect(table.record_klass.column_names).to include("owner_id")
      expect(foreign_key_names(table.table_name)).to include("owner_id_id")
    end

    it "selects the column in detailed" do
      expect(table.record_klass.detailed.to_sql).to include(%("test_grp"."tbl"."owner_id"))
    end

    it "returns rows through detailed" do
      table.record_klass.create!(owner_id: admin.id)
      row = table.record_klass.detailed.first
      expect(row.owner_id).to eq(admin.id)
    end

    it "lists the column in entity_properties" do
      property = table.record_klass.entity_properties.find { |p| p[:name] == "owner_id" }
      expect(property).to include(display_name: "Owner", type: "integer")
    end

    # IMPLEMENTATION_COLUMN_TYPES inverts DataType#sql_name, which rewrites only
    # integer/entity, string and datetime. Everything else is its own grit data
    # type under its own SQL name and has to pass through untouched — mapping
    # "text" to "string" would demote a multiline input to a single-line one.
    it "reads SQL types as the grit types they invert" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "TypedImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "note_col", data_type_name: "text" },
            { identifier: "when_col", data_type_name: "timestamp without time zone" },
            { identifier: "much_col", data_type_name: "decimal" },
            { identifier: "name_col", data_type_name: "varchar" } ]
        end
      end

      typed = klass.create!(identifier: "typ", name: "Typed", schema_definition: schema)
      types = typed.record_klass.entity_properties.to_h { |p| [ p[:name], p[:type] ] }

      expect(types).to include(
        "note_col" => "text",
        "when_col" => "datetime",
        "much_col" => "decimal",
        "name_col" => "string"
      )
    end

    it "lists the column in entity_columns" do
      names = table.record_klass.entity_columns.map { |c| c[:name] }
      expect(names).to include("owner_id")
    end

    it "keeps the column out of the writable field list" do
      names = table.record_klass.entity_fields.map { |f| f[:name] }
      expect(names).not_to include("owner_id")
    end

    it "honours a default_hidden flag on the definition" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "HiddenImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner_id", data_type_name: "bigint", default_hidden: true } ]
        end
      end

      hidden = klass.create!(identifier: "hid", name: "Hidden", schema_definition: schema)
      column = hidden.record_klass.entity_columns.find { |c| c[:name] == "owner_id" }
      expect(column[:default_hidden]).to be(true)
    end

    # An implementation column declared `type: "entity"` is expanded by
    # `entity_columns` into `<name>__<display property>` grid columns, exactly as
    # a dynamic entity column is. `detailed` has to join the target for those to
    # be anything but permanently empty — and with readable.rb's `select_value_for`
    # raising on an unknown property, sorting or filtering one is a 500.
    context "declared as an entity" do
      let(:entity_klass) do
        Class.new(Grit::TableDefinition) do
          def self.name = "EntityImplementationColumnTableDefinition"

          def implementation_column_definitions
            [ { identifier: "owner_id", data_type_name: "bigint", display_name: "Owner",
                type: "entity", default_hidden: true,
                entity: { full_name: "Grit::Core::User", name: "User", path: "grit/core/users",
                          primary_key: "id", primary_key_type: "integer" },
                foreign_key: { table_name: "grit_core_users" } } ]
          end
        end
      end

      let(:owned) { entity_klass.create!(identifier: "own", name: "Owned", schema_definition: schema) }

      it "joins the target table in detailed" do
        sql = owned.record_klass.detailed.to_sql

        expect(sql).to include(%(LEFT OUTER JOIN "grit_core_users" "owner_id__entities" ON "owner_id__entities".id = "test_grp"."own"."owner_id"))
        expect(sql).to include(%(AS "owner_id__login"))
      end

      it "reads the joined values off a row" do
        owned.record_klass.create!(owner_id: admin.id)

        row = owned.record_klass.detailed.first

        expect(row.owner_id).to eq(admin.id)
        expect(row.owner_id__login).to eq(admin.login)
      end

      # Every grid column entity_columns advertises has to be in the select list,
      # or the grid renders it empty and any sort or filter on it raises.
      it "selects every grid column it advertises" do
        # The name each select value lands under: its alias if it has one, else
        # the column part. Quoted or not, the way readable.rb reads them.
        selected = owned.record_klass.detailed.select_values.map do |select_value|
          sql = select_value.to_s
          (sql[/\sAS\s+(\S+)\s*\z/i, 1] || sql.split(".").last).to_s.delete('"')
        end
        advertised = owned.record_klass.entity_columns.map { |c| c[:name] }

        expect(advertised).to include("owner_id__name", "owner_id__login")
        expect(advertised - selected).to be_empty
      end

      it "honours default_hidden on the expanded columns" do
        columns = owned.record_klass.entity_columns.select { |c| c[:entity]&.dig(:column) == "owner_id" }

        expect(columns).not_to be_empty
        expect(columns.map { |c| c[:default_hidden] }).to all(be(true))
      end
    end

    # Writability and presentation are separate axes: `writable:` is a static
    # per-column flag deciding what `entity_fields` hands out, `presented_when:`
    # is a keyword gate deciding what `entity_properties` describes at all.
    context "writable:" do
      let(:writable_klass) do
        Class.new(Grit::TableDefinition) do
          def self.name = "WritableImplementationColumnTableDefinition"

          def implementation_column_definitions
            [ { identifier: "owner_id", data_type_name: "bigint", writable: true } ]
          end
        end
      end

      it "lets an implementation column opt in to being writable" do
        table = writable_klass.create!(identifier: "wrt", name: "Writable", schema_definition: schema)
        expect(table.record_klass.entity_fields.map { |f| f[:name] }).to include("owner_id")
      end
    end

    context "presented_when:" do
      let(:gated_klass) do
        Class.new(Grit::TableDefinition) do
          def self.name = "GatedImplementationColumnTableDefinition"

          def implementation_column_definitions
            [ { identifier: "owner_id", data_type_name: "bigint", writable: true,
                presented_when: :with_owner, foreign_key: { table_name: "grit_core_users" } } ]
          end
        end
      end

      let(:gated) { gated_klass.create!(identifier: "gat", name: "Gated", schema_definition: schema) }

      it "hides the column from every description without the keyword" do
        expect(gated.record_klass.entity_properties.map { |p| p[:name] }).not_to include("owner_id")
        expect(gated.record_klass.entity_columns.map { |c| c[:name] }).not_to include("owner_id")
        expect(gated.record_klass.entity_fields.map { |f| f[:name] }).not_to include("owner_id")
      end

      it "describes the column when the keyword is passed" do
        expect(gated.record_klass.entity_properties(with_owner: true).map { |p| p[:name] }).to include("owner_id")
        expect(gated.record_klass.entity_columns(with_owner: true).map { |c| c[:name] }).to include("owner_id")
        expect(gated.record_klass.entity_fields(with_owner: true).map { |f| f[:name] }).to include("owner_id")
      end

      # The gate is presentation only. `implementation_column_definitions`
      # describes the physical table, so filtering it there instead — the obvious
      # wrong "simplification" — would drop the column and its foreign key.
      it "still builds the physical column and its foreign key" do
        expect(gated.record_klass.column_names).to include("owner_id")
        expect(gated.record_klass.detailed.to_sql).to include(%("test_grp"."gat"."owner_id"))
        expect(foreign_key_names(gated.table_name)).to include("owner_id_id")
      end
    end
  end

  # ==========================================================================
  # T13 — deterministic column order
  # ==========================================================================

  describe "deterministic column order (T13)" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    # Created back to front, so that anything that happens to follow insertion
    # order — or PostgreSQL's heap order, which is what an unordered association
    # really returns — fails these.
    def create_columns_out_of_order(target = table)
      b = Grit::ColumnDefinition.create!(identifier: "b_col", name: "B", sort: 2, data_type: string_type, table_definition: target)
      a = Grit::ColumnDefinition.create!(identifier: "a_col", name: "A", sort: 1, data_type: string_type, table_definition: target)
      [ a, b ]
    end

    it "orders the association by sort" do
      create_columns_out_of_order
      expect(table.ordered_column_definitions.map(&:identifier)).to eq(%w[a_col b_col])
    end

    it "puts definitions with no sort last" do
      Grit::ColumnDefinition.create!(identifier: "z_col", name: "Z", sort: nil, data_type: string_type, table_definition: table)
      Grit::ColumnDefinition.create!(identifier: "a_col", name: "A", sort: 1, data_type: string_type, table_definition: table)

      expect(table.ordered_column_definitions.map(&:identifier)).to eq(%w[a_col z_col])
    end

    it "breaks ties on id" do
      first = Grit::ColumnDefinition.create!(identifier: "b_col", name: "B", sort: 1, data_type: string_type, table_definition: table)
      second = Grit::ColumnDefinition.create!(identifier: "a_col", name: "A", sort: 1, data_type: string_type, table_definition: table)

      expect(table.ordered_column_definitions.map(&:id)).to eq([ first.id, second.id ])
    end

    it "orders the select list in detailed" do
      create_columns_out_of_order
      sql = table.record_klass.detailed.to_sql

      expect(sql.index(%("test_grp"."tbl"."a_col"))).to be < sql.index(%("test_grp"."tbl"."b_col"))
    end

    it "orders entity_properties" do
      create_columns_out_of_order
      names = table.record_klass.entity_properties.map { |property| property[:name] }

      expect(names.index("a_col")).to be < names.index("b_col")
    end

    it "keeps the order across an update to a definition" do
      a, _b = create_columns_out_of_order
      before = table.record_klass.entity_properties.map { |property| property[:name] }

      # An UPDATE rewrites the row in a new heap position, which is exactly what
      # used to reshuffle the grid between two requests.
      a.update!(name: "Renamed")

      expect(table.record_klass.entity_properties.map { |property| property[:name] }).to eq(before)
    end

    it "orders the physical columns when creation is deferred" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "OrderedDeferredTableDefinition"

        def create_table_on_create?
          false
        end
      end

      deferred = klass.create!(identifier: "dfr", name: "Deferred", schema_definition: schema)
      create_columns_out_of_order(deferred)
      deferred.create_table

      expect(connection.columns(deferred.table_name).map(&:name))
        .to eq(%w[id created_by created_at updated_by updated_at owner_id a_col b_col])
    end

    it "falls back to id when the column definition table has no sort column" do
      # `sort` is a convention an includer may not follow; the order still has
      # to be deterministic.
      allow(Grit::ColumnDefinition).to receive(:column_names)
        .and_return(Grit::ColumnDefinition.column_names - [ "sort" ])

      sql = table.ordered_column_definitions.to_sql
      expect(sql).not_to include("sort")
      expect(sql).to include(%(ORDER BY "test_column_definitions"."id" ASC))
    end
  end

  # ==========================================================================
  # Entity columns through record_klass
  #
  # T12 put implementation columns into `detailed` and `entity_properties`
  # alongside the dynamic ones, and T13 fixed the order both are emitted in.
  # The entity branch — a dynamic column pointing at another table — is the
  # part of `detailed` those two changes ran through without being covered:
  # it adds a join and a select per display property of the target, so a
  # regression there shows up as a missing column in the grid rather than as
  # an error.
  # ==========================================================================

  describe "entity columns through record_klass" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    before(:each) do
      Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
    end

    it "joins the target table and selects its display properties" do
      sql = table.record_klass.detailed.to_sql

      expect(sql).to include(%(LEFT OUTER JOIN "grit_core_users" "ref_col__entities" ON "ref_col__entities".id = "test_grp"."tbl"."ref_col"))
      expect(sql).to include(%(AS "ref_col__name"))
      expect(sql).to include(%(AS "ref_col__login"))
    end

    it "reads the joined values off a row" do
      table.record_klass.create!(ref_col: admin.id)

      row = table.record_klass.detailed.first

      expect(row.ref_col).to eq(admin.id)
      expect(row.ref_col__login).to eq(admin.login)
    end

    it "describes the column as an entity reference" do
      property = table.record_klass.entity_properties.find { |p| p[:name] == "ref_col" }

      expect(property[:type]).to eq("entity")
      expect(property[:entity]).to include(full_name: "Grit::Core::User", primary_key: "id")
    end

    it "expands the column into one grid column per display property" do
      columns = table.record_klass.entity_columns.select { |c| c[:entity]&.dig(:column) == "ref_col" }

      expect(columns.map { |c| c[:name] }).to eq(%w[ref_col__name ref_col__login])
      expect(columns.map { |c| c[:display_name] }).to eq([ "Ref Name", "Ref Login" ])
    end

    it "keeps the column writable, under its own name" do
      field = table.record_klass.entity_fields.find { |f| f[:name] == "ref_col" }

      expect(field).not_to be_nil
      expect(field[:entity]).to include(column: "ref_col", display_column: "name")
    end
  end

  # ==========================================================================
  # Dropping a table
  # ==========================================================================

  describe "drop_table" do
    it "drops the table when the definition is destroyed" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(connection.table_exists?(table.table_name)).to be(true)

      table.destroy!

      expect(connection.table_exists?("test_grp.tbl")).to be(false)
    end

    # `drop_table` is the mirror of T5's idempotent `create_table`: a definition
    # whose creation was deferred, or whose table has already gone, still has to
    # be destroyable.
    it "is a no-op when the table is not there" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "UndroppableTableDefinition"

        def create_table_on_create?
          false
        end
      end

      table = klass.create!(identifier: "dfr", name: "Deferred", schema_definition: schema)

      expect { table.destroy! }.not_to raise_error
    end

    it "drops every table in the schema when the schema is destroyed" do
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)
      Grit::TableDefinition.create!(identifier: "two", name: "Two", schema_definition: schema)

      schema.destroy!

      expect(connection.table_exists?("test_grp.one")).to be(false)
      expect(connection.table_exists?("test_grp.two")).to be(false)
    end
  end

  # ==========================================================================
  # Row stamping
  # ==========================================================================

  describe "record_klass stamping" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    it "stamps the current user on create" do
      row = table.record_klass.create!

      expect(row.created_by).to eq(admin.login)
      expect(row.updated_by).to eq(admin.login)
    end

    it "leaves created_by alone on update" do
      row = table.record_klass.create!
      other = create(:grit_core_user, :with_administrator_role)
      set_current_user(other)

      row.update!(owner_id: admin.id)

      expect(row.created_by).to eq(admin.login)
      expect(row.updated_by).to eq(other.login)
    end
  end

  describe "association helpers" do
    it "names the foreign key column after the association" do
      expect(Grit::TableDefinition.schema_definition_id).to eq(:schema_definition_id)
    end
  end
end
