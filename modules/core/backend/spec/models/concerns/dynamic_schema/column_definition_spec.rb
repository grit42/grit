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

# Tests for the DynamicSchema::ColumnDefinition concern, exercised through the
# Grit::ColumnDefinition dummy model.
RSpec.describe "DynamicSchema::ColumnDefinition concern", type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:schema) { Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema") }
  let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }
  let(:string_type) { create(:grit_core_data_type, :string) }
  let(:integer_type) { create(:grit_core_data_type, :integer) }
  let(:entity_type) { create(:grit_core_data_type, :entity) }

  before(:each) do
    set_current_user(admin)
  end

  def connection
    ActiveRecord::Base.connection
  end

  def column(table_name, name)
    connection.columns(table_name).find { |c| c.name == name }
  end

  # T1 — instance methods live in the module body, so an includer can name its
  # association `table_definition` (the concern's own accessor name) without
  # the accessor recursing into itself.
  describe "natural-name association (T1)" do
    it "reads the association rather than recursing" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      expect(definition.table_definition).to eq(table)
    end
  end

  # T2 — check_can_modify is a no-op by default, and overridable via `super`.
  describe "check_can_modify default guard (T2)" do
    it "allows create, update and destroy" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      expect(definition.update(name: "Renamed")).to be(true)
      expect { definition.destroy! }.not_to raise_error
    end

    it "is overridable with super" do
      klass = Class.new(Grit::ColumnDefinition) do
        def self.name = "Grit::OverridingColumnDefinition"

        def check_can_modify
          super
          raise "locked"
        end
      end

      expect {
        klass.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      }.to raise_error("locked")
    end
  end

  # ==========================================================================
  # T7 — schema cache invalidation, seen from the column side
  # ==========================================================================

  describe "schema cache invalidation (T7)" do
    # See the note in table_definition_spec.rb: warming the pool schema cache
    # directly, rather than through `record_klass`, is what leaves no live model
    # naming the table — the state the old descendants-hunt silently skipped.
    def warm_schema_cache(table_name)
      ActiveRecord::Base.connection_pool.schema_cache.columns(table_name).map(&:name)
    end

    it "adds the column to the table" do
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      expect(column(table.table_name, "a_column")).not_to be_nil
    end

    it "builds record_klass from the post-rename shape, not a stale cache" do
      definition = Grit::ColumnDefinition.create!(identifier: "old_name", name: "A", data_type: string_type, table_definition: table)
      table.record_klass.column_names

      # A single update that both renames the column and tightens it. The
      # `required` branch builds a `record_klass` to count nulls; before the
      # refresh was moved inline it read the pre-rename column list and the
      # query referenced a column that no longer existed.
      expect { definition.update!(identifier: "new_name", required: true) }.not_to raise_error

      expect(column(table.table_name, "new_name").null).to be(false)
      expect(column(table.table_name, "old_name")).to be_nil
    end

    it "does not skip the refresh when no live model names the table" do
      # Its own table, so that a `record_klass` left over from another example
      # cannot happen to name it and mask the staleness.
      own_table = Grit::TableDefinition.create!(identifier: "t_own", name: "Own", schema_definition: schema)
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: own_table)
      expect(warm_schema_cache(own_table.table_name)).to include("a_column")

      definition.destroy!

      expect(own_table.record_klass.new.has_attribute?("a_column")).to be(false)
    end
  end

  # ==========================================================================
  # T8 — constraint naming from the column side
  # ==========================================================================

  describe "foreign key constraint naming (T8)" do
    it "names the constraint after the column and the column it references" do
      Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      expect(connection.foreign_keys(table.table_name).map(&:name)).to include("ref_col_id")
    end

    it "renames the constraint along with the column" do
      definition = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      definition.update!(identifier: "new_col")

      names = connection.foreign_keys(table.table_name).map(&:name)
      expect(names).to include("new_col_id")
      expect(names).not_to include("ref_col_id")
    end

    it "names the constraint after the new column when the data type becomes an entity" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: integer_type, table_definition: table)
      expect(connection.foreign_keys(table.table_name).map(&:name)).not_to include("a_column_id")

      definition.update!(data_type: entity_type)

      expect(connection.foreign_keys(table.table_name).map(&:name)).to include("a_column_id")
    end
  end

  # ==========================================================================
  # T11 — blank identifier on update
  # ==========================================================================

  describe "blank identifier (T11)" do
    it "reports an invalid record rather than raising" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect { definition.update(identifier: nil) }.not_to raise_error
      expect(definition).not_to be_valid
      expect(definition.errors[:identifier]).to include("can't be blank")
    end

    it "does not add a reserved-keyword error for a blank identifier" do
      definition = Grit::ColumnDefinition.new(identifier: "", name: "A", data_type: string_type, table_definition: table)
      definition.valid?
      expect(definition.errors[:identifier]).not_to include("is a reserved keyword and cannot be used as identifier")
    end
  end

  # ==========================================================================
  # alter_column — the conversion paths and the two guards that stop a change
  # the existing rows could not survive.
  #
  # None of the tasks above changed what these do, but T7 threaded a
  # `refresh_schema!` through every one of them and T8 rewrote how they name a
  # constraint, so each is covered here to keep that wiring from regressing
  # quietly — a stale cache shows up as a query against a column that no longer
  # exists, which is only visible once a branch is actually taken.
  # ==========================================================================

  describe "altering a column" do
    it "tightens a column to NOT NULL when no value is missing" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      table.record_klass.create!(a_column: "present")

      definition.update!(required: true)

      expect(column(table.table_name, "a_column").null).to be(false)
    end

    it "refuses to require a column that has empty values" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      table.record_klass.create!(a_column: nil)

      expect { definition.update!(required: true) }.to raise_error("Cannot require column with empty values")
    end

    it "refuses to add a required column to a table that has rows" do
      table.record_klass.create!

      expect {
        Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table, required: true)
      }.to raise_error("Cannot require column with empty values")
      expect(Grit::ColumnDefinition.where(identifier: "a_column")).not_to exist
      expect(column(table.table_name, "a_column")).to be_nil
    end

    it "adds a required column to a table with no rows" do
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table, required: true)

      expect(column(table.table_name, "a_column").null).to be(false)
    end

    it "converts a string column to an integer, casting the values through text" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      table.record_klass.create!(a_column: "42")

      definition.update!(data_type: integer_type)

      expect(column(table.table_name, "a_column").sql_type).to eq("bigint")
      expect(table.record_klass.first["a_column"]).to eq(42)
    end

    it "refuses a conversion the existing rows cannot survive" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      table.record_klass.create!(a_column: "not a number")

      expect { definition.update!(data_type: integer_type) }
        .to raise_error(/Failed to convert string to integer because of conflicts in existing rows/)
    end

    it "drops the foreign key when the type stops being an entity" do
      definition = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      expect(connection.foreign_keys(table.table_name).map(&:name)).to include("ref_col_id")

      definition.update!(data_type: integer_type)

      expect(connection.foreign_keys(table.table_name).map(&:name)).not_to include("ref_col_id")
    end

    it "refuses to point a populated column at an entity" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: integer_type, table_definition: table)
      table.record_klass.create!(a_column: 999_999)

      expect { definition.update!(data_type: entity_type) }
        .to raise_error(/because of conflicts in existing rows/)
    end

    # "Conflicts in existing rows" is the right message for a cast the data
    # cannot survive, and the wrong one for everything else a conversion can hit.
    # This used to `raise e.to_s`, which rebuilt whatever came back as a
    # RuntimeError carrying the message and nothing else: a caller rescuing
    # ActiveRecord::Deadlocked to retry stopped seeing it, and the original
    # backtrace never reached the log.
    it "re-raises a failure that is not a bad cast with its class intact" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      allow(connection).to receive(:change_column)
        .and_raise(ActiveRecord::Deadlocked.new("PG::TRDeadlockDetected: ERROR: deadlock detected"))

      expect { definition.update!(data_type: integer_type) }.to raise_error(ActiveRecord::Deadlocked)
    end

    it "still translates a bad cast into the conflicts message" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      allow(connection).to receive(:change_column)
        .and_raise(ActiveRecord::StatementInvalid.new(%(PG::InvalidTextRepresentation: ERROR: invalid input syntax for type bigint: "x")))

      expect { definition.update!(data_type: integer_type) }
        .to raise_error(RuntimeError, /Failed to convert string to integer because of conflicts in existing rows/)
    end
  end

  # ==========================================================================
  # Columns whose table is not there yet
  # ==========================================================================

  describe "a table that was never materialised" do
    # T5 made deferring creation supported rather than accidental, so the
    # column-side guards that make it work are worth pinning: a definition may
    # be created and destroyed entirely before its table exists, and neither
    # may reach for a table that is not there.
    let(:deferred) do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "Grit::DeferredColumnTableDefinition"

        def create_table_on_create?
          false
        end
      end
      klass.create!(identifier: "dfr", name: "Deferred", schema_definition: schema)
    end

    it "adds no column while the table is absent" do
      expect {
        Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: deferred)
      }.not_to raise_error
      expect(connection.table_exists?(deferred.table_name)).to be(false)
    end

    it "drops no column while the table is absent" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: deferred)
      expect { definition.destroy! }.not_to raise_error
    end

    it "materialises the column once the table is created" do
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: deferred)

      deferred.create_table

      expect(column(deferred.table_name, "a_column")).not_to be_nil
    end
  end

  # ==========================================================================
  # One definition per physical column
  # ==========================================================================

  describe "unique column identifiers" do
    # Without this, the second definition raised PG::DuplicateColumn out of
    # `after_create :create_column` — and where the table is not there yet, no
    # error at all: both rows commit and `create_table` emits `t.column` twice.
    it "rejects a duplicate identifier within one table" do
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      clash = Grit::ColumnDefinition.new(identifier: "a_column", name: "B", data_type: string_type, table_definition: table)

      expect(clash).not_to be_valid
      expect(clash.errors[:identifier].join).to match(/already taken by another column/)
    end

    # The deferred path is the one with no PG::DuplicateColumn to fall back on.
    it "rejects a duplicate identifier before the table exists" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "DeferredUniqueColumnTableDefinition"

        def create_table_on_create?
          false
        end
      end

      deferred = klass.create!(identifier: "dfr", name: "Deferred", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: deferred)

      clash = Grit::ColumnDefinition.new(identifier: "a_column", name: "B", data_type: string_type, table_definition: deferred)

      expect(deferred.table_exists?).to be(false)
      expect(clash).not_to be_valid
    end

    it "allows the same identifier under different tables" do
      other = Grit::TableDefinition.create!(identifier: "other", name: "Other", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(Grit::ColumnDefinition.new(identifier: "a_column", name: "B", data_type: string_type, table_definition: other)).to be_valid
    end

    it "lets a definition be updated without colliding with itself" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(definition.update(name: "Renamed")).to be(true)
    end
  end

  # ==========================================================================
  # A column identifier never becomes a method
  # ==========================================================================

  describe "identifiers that name ActiveRecord methods" do
    # `record_klass` defines no method per column, so a column may take the name
    # of any method a record has: one Rails would refuse with
    # DangerousAttributeError (`save`, `create_or_update`), one it would generate
    # a clashing method from (`valid?` for `valid`, `mutations_before_last_save`
    # for `mutations`), one assignment or serialization would otherwise call
    # (`attributes=`, `record_timestamps=`, `destroy`), or one only Kernel
    # defines (`format`, `send`).
    identifiers = %w[save valid attribute attributes destroy format send create_or_update mutations record_timestamps]
    values = identifiers.index_with { |identifier| "#{identifier} value" }

    def create_columns(identifiers)
      identifiers.each do |identifier|
        Grit::ColumnDefinition.create!(identifier: identifier, name: identifier.humanize, data_type: string_type, table_definition: table)
      end
    end

    identifiers.each do |identifier|
      it "accepts #{identifier}" do
        record = Grit::ColumnDefinition.new(identifier: identifier, name: "X", data_type: string_type, table_definition: table)

        expect(record).to be_valid
      end
    end

    it "stores and reads back a value in each column" do
      create_columns(identifiers)

      row = table.record_klass.create!(values)

      expect(row.reload.attributes.slice(*identifiers)).to eq(values)
    end

    it "updates each column" do
      create_columns(identifiers)
      row = table.record_klass.create!
      updated = identifiers.index_with { |identifier| "#{identifier} updated" }

      row.update!(updated)

      expect(row.reload.attributes.slice(*identifiers)).to eq(updated)
    end

    # Scope attributes skip `assign_attributes` and are assigned one by one,
    # through the same setter lookup.
    it "assigns each column from the scope it is created through" do
      create_columns(identifiers)

      row = table.record_klass.where(values).create!

      expect(row.reload.attributes.slice(*identifiers)).to eq(values)
    end

    # Serialization reads each attribute with `send` by default, which on the
    # `destroy` column would destroy the row.
    it "serializes each column without calling the method it shares a name with" do
      create_columns(identifiers)
      row = table.record_klass.create!(values)

      expect(row.as_json.slice(*identifiers)).to eq(values)
      expect(table.record_klass.exists?(row.id)).to be(true)
    end

    it "reads each column for validation without calling the method it shares a name with" do
      create_columns(identifiers)
      row = table.record_klass.create!(values)

      expect(row.read_attribute_for_validation(:destroy)).to eq("destroy value")
      expect(table.record_klass.exists?(row.id)).to be(true)
    end

    # The base columns are the table's own, so they stay reserved.
    it "keeps refusing a base column" do
      record = Grit::ColumnDefinition.new(identifier: "created_at", name: "X", data_type: string_type, table_definition: table)

      expect(record).not_to be_valid
      expect(record.errors[:identifier]).to include("is a reserved keyword and cannot be used as identifier")
    end
  end

  # ==========================================================================
  # A physical column with no definition row behind it
  # ==========================================================================

  describe "a column that exists on the table but not in the definitions" do
    # `TableDefinition#identifier_unique_in_schema` falls back to `table_exists?`
    # for exactly this; without the column-level equivalent the record validates
    # and `after_create :create_column` raises PG::DuplicateColumn, which reaches
    # the caller as a 500 rather than as an invalid record.
    it "reports an invalid record rather than raising" do
      connection.add_column table.table_name, "orphan", "varchar"
      table.refresh_schema!

      definition = Grit::ColumnDefinition.new(identifier: "orphan", name: "Orphan", data_type: string_type, table_definition: table)

      expect(definition).not_to be_valid
      expect(definition.errors[:identifier].join).to match(/the column orphan already exists/)
    end

    it "raises no PG error on create!" do
      connection.add_column table.table_name, "orphan", "varchar"
      table.refresh_schema!

      expect {
        Grit::ColumnDefinition.create!(identifier: "orphan", name: "Orphan", data_type: string_type, table_definition: table)
      }.to raise_error(ActiveRecord::RecordInvalid, /already exists/)
    end

    # A rename walks into the same wall, and has the same claim on a readable
    # error.
    it "refuses a rename onto an orphaned column" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      connection.add_column table.table_name, "orphan", "varchar"
      table.refresh_schema!

      expect(definition.update(identifier: "orphan")).to be(false)
      expect(definition.errors[:identifier].join).to match(/already exists/)
    end

    # The sibling row is the more specific answer, so it wins where both apply.
    it "prefers the sibling-row message when a definition owns the column" do
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      clash = Grit::ColumnDefinition.new(identifier: "a_column", name: "B", data_type: string_type, table_definition: table)

      expect(clash).not_to be_valid
      expect(clash.errors[:identifier]).to eq([ "is already taken by another column of this table" ])
    end

    # Base and implementation columns are physically present too, and both are
    # already reported by an earlier validation. One message each, not two.
    it "leaves the implementation-column message alone" do
      record = Grit::ColumnDefinition.new(identifier: "owner_id", name: "X", data_type: string_type, table_definition: table)

      expect(record).not_to be_valid
      expect(record.errors[:identifier]).to eq([ "is reserved by this table and cannot be used as identifier" ])
    end
  end

  describe "table_definition_unchanged" do
    # `alter_column` reacts to a changed identifier, `required` or `data_type_id`
    # and nothing else, so the physical column would stay on the old table.
    it "refuses to move a column definition to another table" do
      other = Grit::TableDefinition.create!(identifier: "other", name: "Other", schema_definition: schema)
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(definition.update(table_definition: other)).to be(false)
      expect(definition.errors[:base].join).to match(/cannot be moved to another table/)
      expect(table.record_klass.column_names).to include("a_column")
      expect(other.record_klass.column_names).not_to include("a_column")
    end
  end

  # ==========================================================================
  # Dropping a column
  #
  # The drop names what the saved row resolves to. A refused change leaves
  # another column's or another table's name in memory.
  # ==========================================================================

  describe "drop_column" do
    it "drops its own column, not the one a refused rename names" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      Grit::ColumnDefinition.create!(identifier: "b_column", name: "B", data_type: string_type, table_definition: table)

      expect(definition.update(identifier: "b_column")).to be(false)
      definition.destroy!

      expect(column(table.table_name, "a_column")).to be_nil
      expect(column(table.table_name, "b_column")).not_to be_nil
    end

    it "drops its own column after a refused move to another table" do
      other = Grit::TableDefinition.create!(identifier: "other", name: "Other", schema_definition: schema)
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: other)

      expect(definition.update(table_definition: other)).to be(false)
      definition.destroy!

      expect(column("test_grp.tbl", "a_column")).to be_nil
      expect(column("test_grp.other", "a_column")).not_to be_nil
    end

    it "drops its own column when its table definition carries a refused rename" do
      other = Grit::TableDefinition.create!(identifier: "other", name: "Other", schema_definition: schema)
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: other)

      expect(table.update(identifier: "other")).to be(false)
      definition.destroy!

      expect(column("test_grp.tbl", "a_column")).to be_nil
      expect(column("test_grp.other", "a_column")).not_to be_nil
    end

    # Destroy callbacks run on a record that was never saved.
    it "drops nothing when destroyed before it was saved" do
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      Grit::ColumnDefinition.new(identifier: "a_column", name: "Clash", data_type: string_type, table_definition: table).destroy

      expect(column(table.table_name, "a_column")).not_to be_nil
    end
  end

  # ==========================================================================
  # Column count ceiling
  # ==========================================================================

  describe "column count guard" do
    # PostgreSQL's own ceiling is 1600 columns, but the grid stops being usable
    # long before that. Stubbed rather than created 250 times over: every
    # create is a real ALTER TABLE.
    it "refuses a column past the ceiling" do
      table # materialise it before the stub, which the real creation path reads too
      allow_any_instance_of(Grit::TableDefinition).to receive(:column_definitions).and_return(Array.new(250))

      definition = Grit::ColumnDefinition.new(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(definition).not_to be_valid
      expect(definition.errors[:base].join).to match(/cannot have more than 250 columns/)
    end

    # A validation error rather than the bare RuntimeError this used to raise out
    # of `before_create`, which reached the caller as a 500.
    it "reports an invalid record rather than raising" do
      table
      allow_any_instance_of(Grit::TableDefinition).to receive(:column_definitions).and_return(Array.new(250))

      expect {
        Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      }.to raise_error(ActiveRecord::RecordInvalid, /cannot have more than 250 columns/)
    end

    # The ceiling is on the *physical* table, which is what the message says: the
    # five base columns and every implementation column occupy it too. Counting
    # only the dynamic ones would let the table past the number it claims to cap.
    it "counts the base and implementation columns towards the ceiling" do
      table # Grit::TableDefinition declares one implementation column, `owner_id`
      allow_any_instance_of(Grit::TableDefinition).to receive(:column_definitions).and_return(Array.new(244))

      definition = Grit::ColumnDefinition.new(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(definition.table_definition.physical_column_count).to eq(250)
      expect(definition).not_to be_valid
    end

    # The stubs above stand a plain Array in for the association, so they never
    # reach ActiveRecord's own `size`, which counts the new records sitting in the
    # association's target on top of the persisted ones. A column built through
    # the association is one of those, so it used to count itself and the
    # ceiling fell one short. These go through the real association instead,
    # with the ceiling lowered so the table can be filled for real: room for two
    # dynamic columns on top of the five base and one implementation columns.
    context "through the real association" do
      before do
        stub_const("Grit::Core::Model::DynamicSchema::TableDefinition::MAX_COLUMNS", 8)
      end

      def attributes_for(identifier)
        { identifier: identifier, name: identifier.humanize, data_type: string_type }
      end

      # A fresh instance, so that what `table` has cached of the association
      # does not decide which branch of `size` runs.
      def fresh_table
        Grit::TableDefinition.find(table.id)
      end

      it "admits the last column built through an unloaded association" do
        table.column_definitions.create!(attributes_for("first"))
        owner = fresh_table

        definition = owner.column_definitions.build(attributes_for("last"))

        expect(owner.column_definitions).not_to be_loaded
        expect(definition).to be_valid
      end

      it "admits the last column built through a loaded association" do
        table.column_definitions.create!(attributes_for("first"))
        owner = fresh_table
        owner.column_definitions.load

        expect(owner.column_definitions.build(attributes_for("last"))).to be_valid
      end

      it "admits the last column built standalone" do
        table.column_definitions.create!(attributes_for("first"))

        expect(Grit::ColumnDefinition.new(**attributes_for("last"), table_definition: fresh_table)).to be_valid
      end

      it "refuses a column past the ceiling however it is built" do
        table.column_definitions.create!(attributes_for("first"))
        table.column_definitions.create!(attributes_for("second"))

        expect(fresh_table.column_definitions.build(attributes_for("third"))).not_to be_valid
        expect(Grit::ColumnDefinition.new(**attributes_for("third"), table_definition: fresh_table)).not_to be_valid
      end

      # Each new column is validated with its unsaved siblings in the target, so
      # each has to count the others but not itself.
      it "admits a batch that fills the table exactly" do
        owner = fresh_table
        owner.column_definitions.build(attributes_for("first"))
        owner.column_definitions.build(attributes_for("second"))

        expect { owner.save! }.to change { Grit::ColumnDefinition.where(table_definition_id: table.id).count }.from(0).to(2)
      end

      it "refuses a batch that overflows the table" do
        owner = fresh_table
        %w[first second third].each { |identifier| owner.column_definitions.build(attributes_for(identifier)) }

        expect(owner).not_to be_valid
        expect(owner.column_definitions.map { |definition| definition.errors[:base].join }).to all(match(/cannot have more than 8 columns/))
      end
    end
  end

  describe "association helpers" do
    it "names the foreign key column after the association" do
      expect(Grit::ColumnDefinition.table_definition_id).to eq(:table_definition_id)
    end
  end

  describe "an includer that has not declared belongs_to_table_definition" do
    let(:klass) do
      Class.new(ApplicationRecord) do
        def self.name = "UndeclaredTableColumnDefinition"
        self.table_name = "test_column_definitions"
        include Grit::Core::Model::DynamicSchema::ColumnDefinition
      end
    end

    it "skips the validations that need the table rather than raising" do
      definition = klass.new(identifier: "a_column", name: "A", data_type: string_type)

      expect { definition.valid? }.not_to raise_error
      expect(definition.table_definition).to be_nil
    end
  end

  # PostgreSQL gives every table these, and refuses them as column names.
  describe "system column names" do
    %w[tableoid xmin cmin xmax cmax ctid].each do |identifier|
      it "rejects #{identifier}" do
        definition = Grit::ColumnDefinition.new(identifier: identifier, name: "X", data_type: string_type, table_definition: table)

        expect(definition).not_to be_valid
        expect(definition.errors[:identifier].join).to include("system column")
      end
    end

    it "rejects a rename onto one" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(definition.update(identifier: "xmin")).to be(false)
      expect(column(table.table_name, "a_column")).to be_present
    end
  end

  # `detailed` names an entity column's display properties `<column>__<property>`.
  describe "display column aliases" do
    it "rejects an identifier containing a double underscore" do
      definition = Grit::ColumnDefinition.new(identifier: "owner__name", name: "Owner name", data_type: string_type, table_definition: table)

      expect(definition).not_to be_valid
      expect(definition.errors[:identifier].join).to include("double underscore")
    end

    it "allows a leading double underscore, which no alias can start with" do
      definition = Grit::ColumnDefinition.new(identifier: "__notes", name: "Notes", data_type: string_type, table_definition: table)

      expect(definition).to be_valid
    end
  end
end
