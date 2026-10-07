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

# Exercised through the Grit::ColumnDefinition dummy model.
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

  # The includer's association shares the concern's accessor name, `table_definition`,
  # which must not recurse into itself.
  describe "natural-name association (T1)" do
    it "reads the association rather than recursing" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      expect(definition.table_definition).to eq(table)
    end
  end

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

  describe "the physical column (T7)" do
    it "is added to the table under the definition's id" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(definition.draft_column_name).to eq("c#{definition.id}")
      expect(column(table.table_name, "c#{definition.id}")).not_to be_nil
      expect(column(table.table_name, "a_column")).to be_nil
    end

    it "takes a rename and a requirement in one update" do
      definition = Grit::ColumnDefinition.create!(identifier: "old_name", name: "A", data_type: string_type, table_definition: table)
      row_id = insert_draft_row(table, old_name: "present")

      expect { definition.update!(identifier: "new_name", required: true) }.not_to raise_error

      expect(column(table.table_name, "c#{definition.id}").null).to be(false)
      expect(draft_value(table, row_id, :new_name)).to eq("present")
    end
  end

  describe "foreign key constraint naming (T8)" do
    def foreign_key_names
      connection.foreign_keys(table.table_name).map(&:name)
    end

    it "names the constraint after the column's id and the column it references" do
      definition = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)

      expect(foreign_key_names).to include("c#{definition.id}_id")
    end

    it "keeps the constraint name when the identifier changes" do
      definition = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)

      definition.update!(identifier: "new_col")

      expect(foreign_key_names).to include("c#{definition.id}_id")
    end

    it "names the constraint after the column when the data type becomes an entity" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: integer_type, table_definition: table)
      expect(foreign_key_names).not_to include("c#{definition.id}_id")

      definition.update!(data_type: entity_type)

      expect(foreign_key_names).to include("c#{definition.id}_id")
    end
  end

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

  describe "altering a column" do
    def physical_column(definition)
      column(table.table_name, "c#{definition.id}")
    end

    it "tightens a column to NOT NULL when no value is missing" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      insert_draft_row(table, a_column: "present")

      definition.update!(required: true)

      expect(physical_column(definition).null).to be(false)
    end

    it "refuses to require a column that has empty values" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      insert_draft_row(table, a_column: nil)

      expect { definition.update!(required: true) }.to raise_error("Cannot require column with empty values")
    end

    it "refuses to add a required column to a table that has rows" do
      insert_draft_row(table)

      expect {
        Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table, required: true)
      }.to raise_error("Cannot require column with empty values")
      expect(Grit::ColumnDefinition.where(identifier: "a_column")).not_to exist
      expect(connection.columns(table.table_name).map(&:name)).to eq(%w[id created_by created_at updated_by updated_at owner_id])
    end

    it "adds a required column to a table with no rows" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table, required: true)

      expect(physical_column(definition).null).to be(false)
    end

    it "converts a string column to an integer, casting the values through text" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      row_id = insert_draft_row(table, a_column: "42")

      definition.update!(data_type: integer_type)

      expect(physical_column(definition).sql_type).to eq("bigint")
      expect(draft_value(table, row_id, :a_column)).to eq(42)
    end

    it "refuses a conversion the existing rows cannot survive" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      insert_draft_row(table, a_column: "not a number")

      expect { definition.update!(data_type: integer_type) }
        .to raise_error(/Failed to convert string to integer because of conflicts in existing rows/)
    end

    it "drops the foreign key when the type stops being an entity" do
      definition = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      expect(connection.foreign_keys(table.table_name).map(&:name)).to include("c#{definition.id}_id")

      definition.update!(data_type: integer_type)

      expect(connection.foreign_keys(table.table_name).map(&:name)).not_to include("c#{definition.id}_id")
    end

    it "refuses to point a populated column at an entity" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: integer_type, table_definition: table)
      insert_draft_row(table, a_column: 999_999)

      expect { definition.update!(data_type: entity_type) }
        .to raise_error(/because of conflicts in existing rows/)
    end

    # Two entity types can share a table and SQL type (e.g. two vocabularies), so the ids
    # would cast cleanly but silently point at the other type's items.
    it "refuses to point a populated entity column at another entity type" do
      other_entity_type = create(:grit_core_data_type, :entity)
      definition = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      insert_draft_row(table, ref_col: admin.id)

      expect { definition.update!(data_type: other_entity_type) }
        .to raise_error(/because of conflicts in existing rows/)
    end

    it "points an empty entity column at another entity type" do
      other_entity_type = create(:grit_core_data_type, :entity)
      definition = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)

      definition.update!(data_type: other_entity_type)

      expect(connection.foreign_keys(table.table_name).map(&:name)).to include("c#{definition.id}_id")
    end

    # Only a bad cast becomes the "conflicts in existing rows" error; anything else keeps its
    # class and backtrace, so a caller can still rescue a deadlock and retry.
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

    it "runs no DDL for a change of identifier, name, description or sort" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      statements = []
      subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*, payload|
        statements << payload[:sql]
      end
      begin
        definition.update!(identifier: "b_column", name: "Renamed", description: "Described", sort: 4)
      ensure
        ActiveSupport::Notifications.unsubscribe(subscriber)
      end

      expect(statements.grep(/\A\s*ALTER/i)).to be_empty
    end
  end

  describe "the columns of a committed schema" do
    let!(:definition) { Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table) }

    before(:each) { schema.commit! }

    it "refuses a new column" do
      added = Grit::ColumnDefinition.new(identifier: "b_column", name: "B", data_type: string_type, table_definition: table)

      expect(added.save).to be(false)
      expect(added.errors[:base].join).to match(/test_grp is committed: revert it to draft to change its structure/)
    end

    it "refuses a change of identifier, type or requirement" do
      expect(definition.update(identifier: "b_column")).to be(false)
      expect(definition.reload.update(data_type: integer_type)).to be(false)
      expect(definition.reload.update(required: true)).to be(false)
      expect(column("test_grp.tbl", "a_column").sql_type).to eq("character varying")
    end

    it "refuses to be destroyed" do
      expect(definition.destroy).to be(false)
      expect(column("test_grp.tbl", "a_column")).not_to be_nil
    end

    # Identifier rules run on every save, so an identifier that code has since made invalid
    # blocks even a display rename; changing the identifier needs a revert.
    it "says how out when code has made its identifier invalid" do
      allow_any_instance_of(Grit::ColumnDefinition).to receive(:reserved_identifiers)
        .and_return(Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS + [ "a_column" ])

      expect(definition.update(name: "Renamed")).to be(false)
      expect(definition.errors[:base]).to include("The schema is committed: revert it to draft to change the identifier")
    end

    it "lets the name, description and sort change" do
      expect(definition.update(name: "Renamed", description: "Described", sort: 4)).to be(true)
      expect(table.record_klass.entity_properties.find { |p| p[:name] == "a_column" }[:display_name]).to eq("Renamed")
    end

    # Simulates a request racing the commit, which loaded the definitions while still a draft.
    it "reads the committed state from the locked row rather than memory" do
      stale = Grit::ColumnDefinition.find(definition.id)
      stale.table_definition.schema_definition.committed_at = nil

      expect(stale.update(required: true)).to be(false)
      expect(column("test_grp.tbl", "a_column").null).to be(true)
    end
  end

  describe "unique column identifiers" do
    # Draft columns are `c<id>`, so the database would only catch the clash at commit.
    it "rejects a duplicate identifier within one table" do
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      clash = Grit::ColumnDefinition.new(identifier: "a_column", name: "B", data_type: string_type, table_definition: table)

      expect(clash).not_to be_valid
      expect(clash.errors[:identifier].join).to match(/already taken by another column/)
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

    # The catalog is not consulted: the column is `c<id>` until committed.
    it "leaves a column standing under the identifier alone" do
      connection.add_column table.table_name, "orphan", "varchar"

      expect(Grit::ColumnDefinition.new(identifier: "orphan", name: "Orphan", data_type: string_type, table_definition: table)).to be_valid
    end

    it "reports one message where a sibling owns the identifier" do
      Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      clash = Grit::ColumnDefinition.new(identifier: "a_column", name: "B", data_type: string_type, table_definition: table)

      expect(clash).not_to be_valid
      expect(clash.errors[:identifier]).to eq([ "is already taken by another column of this table" ])
    end

    it "reports one message where an implementation column owns the identifier" do
      record = Grit::ColumnDefinition.new(identifier: "owner_id", name: "X", data_type: string_type, table_definition: table)

      expect(record).not_to be_valid
      expect(record.errors[:identifier]).to eq([ "is reserved by this table and cannot be used as identifier" ])
    end
  end

  describe "identifiers that name ActiveRecord methods" do
    # `record_klass` defines no method per column, so a column may take any record method's
    # name: one Rails refuses (`save`), would generate a clash from (`valid`), calls on
    # assignment or serialization (`destroy`), or only Kernel defines (`format`).
    identifiers = %w[save valid attribute attributes destroy format send create_or_update mutations record_timestamps]
    values = identifiers.index_with { |identifier| "#{identifier} value" }

    identifiers.each do |identifier|
      it "accepts #{identifier}" do
        record = Grit::ColumnDefinition.new(identifier: identifier, name: "X", data_type: string_type, table_definition: table)

        expect(record).to be_valid
      end
    end

    def create_columns(identifiers)
      identifiers.each do |identifier|
        Grit::ColumnDefinition.create!(identifier: identifier, name: identifier.humanize, data_type: string_type, table_definition: table)
      end
    end

    def read_back(row, identifiers)
      reloaded = table.record_klass.find(row.id)
      identifiers.index_with { |identifier| reloaded[identifier] }
    end

    shared_examples "columns named after methods" do
      it "stores and reads back a value in each column" do
        row = table.record_klass.create!(values)

        expect(read_back(row, identifiers)).to eq(values)
      end

      it "updates each column" do
        row = table.record_klass.create!
        updated = identifiers.index_with { |identifier| "#{identifier} updated" }

        row.update!(updated)

        expect(read_back(row, identifiers)).to eq(updated)
      end

      # Scope attributes skip `assign_attributes` and are assigned one by one,
      # through the same setter lookup.
      it "assigns each column from the scope it is created through" do
        row = table.record_klass.where(values).create!

        expect(read_back(row, identifiers)).to eq(values)
      end

      # Serialization reads each attribute with `send` by default, which on the
      # `destroy` column would destroy the row.
      it "serializes each column without calling the method it shares a name with" do
        row = table.record_klass.create!(values)

        expect(table.record_klass.find(row.id).as_json.slice(*identifiers)).to eq(values)
        expect(table.record_klass.detailed.find(row.id).as_json.slice(*identifiers)).to eq(values)
        expect(table.record_klass.exists?(row.id)).to be(true)
      end

      it "reads each column for validation without calling the method it shares a name with" do
        row = table.record_klass.create!(values)

        expect(row.read_attribute_for_validation(:destroy)).to eq("destroy value")
        expect(table.record_klass.exists?(row.id)).to be(true)
      end
    end

    context "once committed" do
      before(:each) do
        create_columns(identifiers)
        schema.commit!
      end

      include_examples "columns named after methods"
    end

    # The base columns are the table's own, so they stay reserved.
    it "keeps refusing a base column" do
      record = Grit::ColumnDefinition.new(identifier: "created_at", name: "X", data_type: string_type, table_definition: table)

      expect(record).not_to be_valid
      expect(record.errors[:identifier]).to include("is a reserved keyword and cannot be used as identifier")
    end
  end

  describe "table_definition_unchanged" do
    # `alter_column` ignores a table change, so the physical column would stay behind.
    it "refuses to move a column definition to another table" do
      other = Grit::TableDefinition.create!(identifier: "other", name: "Other", schema_definition: schema)
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(definition.update(table_definition: other)).to be(false)
      expect(definition.errors[:base].join).to match(/cannot be moved to another table/)
      expect(column(table.table_name, "c#{definition.id}")).not_to be_nil
      expect(column(other.table_name, "c#{definition.id}")).to be_nil
    end
  end

  # The column is named after its id, which no refused change can touch.
  describe "drop_column" do
    it "drops its own column after a refused rename" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      other = Grit::ColumnDefinition.create!(identifier: "b_column", name: "B", data_type: string_type, table_definition: table)

      expect(definition.update(identifier: "b_column")).to be(false)
      definition.destroy!

      expect(column(table.table_name, "c#{definition.id}")).to be_nil
      expect(column(table.table_name, "c#{other.id}")).not_to be_nil
    end

    it "drops its own column after a refused move to another table" do
      other = Grit::TableDefinition.create!(identifier: "other", name: "Other", schema_definition: schema)
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      table_name = table.table_name

      expect(definition.update(table_definition: other)).to be(false)
      definition.destroy!

      expect(column(table_name, "c#{definition.id}")).to be_nil
    end

    it "stays in a committed schema after a refused move to a draft one" do
      other_schema = Grit::SchemaDefinition.create!(identifier: "other", name: "Other")
      other = Grit::TableDefinition.create!(identifier: "other", name: "Other", schema_definition: other_schema)
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      schema.commit!

      expect(definition.update(table_definition: other)).to be(false)

      expect(definition.destroy).to be(false)
      expect(column("test_grp.tbl", "a_column")).not_to be_nil
    end

    # Destroy callbacks run on a record that was never saved.
    it "drops nothing when destroyed before it was saved" do
      definition = Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      Grit::ColumnDefinition.new(identifier: "a_column", name: "Clash", data_type: string_type, table_definition: table).destroy

      expect(column(table.table_name, "c#{definition.id}")).not_to be_nil
    end
  end

  describe "column count guard" do
    # Far below PostgreSQL's 1600-column limit, for the grid's sake. Stubbed because each
    # real create runs an ALTER TABLE.
    it "refuses a column past the ceiling" do
      table # materialise it before the stub, which the real creation path reads too
      allow_any_instance_of(Grit::TableDefinition).to receive(:column_definitions).and_return(Array.new(250))

      definition = Grit::ColumnDefinition.new(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(definition).not_to be_valid
      expect(definition.errors[:base].join).to match(/cannot have more than 250 columns/)
    end

    # A raise from `before_create` would reach the caller as a 500.
    it "reports an invalid record rather than raising" do
      table
      allow_any_instance_of(Grit::TableDefinition).to receive(:column_definitions).and_return(Array.new(250))

      expect {
        Grit::ColumnDefinition.create!(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)
      }.to raise_error(ActiveRecord::RecordInvalid, /cannot have more than 250 columns/)
    end

    # The ceiling is on the physical table: 244 dynamic + 5 base + `owner_id` = 250.
    it "counts the base and implementation columns towards the ceiling" do
      table # Grit::TableDefinition declares one implementation column, `owner_id`
      allow_any_instance_of(Grit::TableDefinition).to receive(:column_definitions).and_return(Array.new(244))

      definition = Grit::ColumnDefinition.new(identifier: "a_column", name: "A", data_type: string_type, table_definition: table)

      expect(definition.table_definition.physical_column_count).to eq(250)
      expect(definition).not_to be_valid
    end

    # The association's `size` includes unsaved records in its target, which the Array stubs
    # above bypass; a column built through it must not count itself. MAX_COLUMNS 8 leaves
    # room for two dynamic columns beside the 5 base and `owner_id`.
    context "through the real association" do
      before do
        stub_const("Grit::Core::Model::DynamicSchema::TableDefinition::MAX_COLUMNS", 8)
      end

      def attributes_for(identifier)
        { identifier: identifier, name: identifier.humanize, data_type: string_type }
      end

      # A fresh instance, so `table`'s cached association doesn't pick the `size` branch.
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
      expect(column(table.table_name, "c#{definition.id}")).to be_present
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
