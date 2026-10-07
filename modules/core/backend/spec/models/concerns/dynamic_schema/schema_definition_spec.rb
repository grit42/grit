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

# Exercised through the Grit::SchemaDefinition dummy model. Real DDL runs; PostgreSQL's
# transactional DDL lets `use_transactional_fixtures` roll it back per example.
RSpec.describe "DynamicSchema::SchemaDefinition concern", type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:string_type) { create(:grit_core_data_type, :string) }
  let(:entity_type) { create(:grit_core_data_type, :entity) }
  let(:schema) { Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema") }

  before(:each) do
    set_current_user(admin)
  end

  def connection
    ActiveRecord::Base.connection
  end

  def column_names(table_name)
    connection.columns(table_name).map(&:name)
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

  # For an example whose class declares a prefix the dummy app does not.
  def declare_schema_prefix(prefix)
    declared = Grit::Core::Engine.config.grit.dynamic_schema_prefixes
    allow(Grit::Core::Engine.config.grit).to receive(:dynamic_schema_prefixes).and_return(declared + [ prefix ])
  end

  def create_table(identifier = "measures", schema_definition: schema)
    Grit::TableDefinition.create!(identifier: identifier, name: identifier.humanize, schema_definition: schema_definition)
  end

  def create_column(table, identifier = "label", data_type: string_type)
    Grit::ColumnDefinition.create!(identifier: identifier, name: identifier.humanize, data_type: data_type, table_definition: table)
  end

  # The includer's association shares the concern's accessor name, `table_definitions`,
  # which must not recurse into itself.
  describe "natural-name association (T1)" do
    it "reads the association rather than recursing" do
      expect(schema.table_definitions.to_a).to eq([])
    end

    it "sees table definitions added to the association" do
      table = create_table
      expect(schema.table_definitions.reload.to_a).to eq([ table ])
    end
  end

  describe "association helpers" do
    def renamed_schema_class(**options)
      Class.new(ApplicationRecord) do
        def self.name = "Grit::RenamedSchemaDefinition"
        self.table_name = "test_schema_definitions"
        include Grit::Core::Model::DynamicSchema::SchemaDefinition
        dynamic_schema_prefix "test"
        has_many_table_definitions :tables, class_name: "Grit::TableDefinition", foreign_key: :schema_definition_id, **options
      end
    end

    it "takes has_many options" do
      renamed = renamed_schema_class.create!(identifier: "grp", name: "Schema")
      table = Grit::TableDefinition.create!(identifier: "measures", name: "Measures", schema_definition_id: renamed.id)

      expect(renamed.table_definitions.to_a).to eq([ table ])
      renamed.commit!
      expect(connection.table_exists?("test_grp.measures")).to be(true)
    end

    it "keeps the cascade its own" do
      expect { renamed_schema_class(dependent: :nullify) }.to raise_error(ArgumentError, /dependent/)
    end
  end

  describe "check_can_modify default guard (T2)" do
    it "allows create, update and destroy" do
      expect(schema.update(name: "Renamed")).to be(true)
      expect { schema.destroy! }.not_to raise_error
    end

    it "is overridable with super" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "OverridingSchemaDefinition"

        def check_can_modify
          super
          raise "locked"
        end
      end

      expect { klass.create!(identifier: "grp", name: "Schema") }.to raise_error("locked")
    end
  end

  # The guard also stands before commit, revert and drop.
  describe "check_can_modify beyond save" do
    let(:locked_klass) do
      Class.new(Grit::SchemaDefinition) do
        def self.name = "LockedSchemaDefinition"

        def check_can_modify
          super
          return unless name == "Locked"
          errors.add(:base, "is locked")
          throw :abort
        end
      end
    end
    let(:own) { locked_klass.create!(identifier: "lck", name: "Open") }

    def lock(definition)
      locked_klass.find(definition.id).update_columns(name: "Locked")
    end

    # Locked through another instance: the commit reads the locked row, not memory.
    it "refuses a commit and leaves the draft as it was" do
      create_table(schema_definition: own)
      lock(own)

      expect { own.commit! }.to raise_error(Grit::Core::Model::DynamicSchema::CommitError, "Schema lck: is locked")
      expect(own).not_to be_committed
      expect(own.reload).not_to be_committed
      expect(connection.schema_exists?("test_#{own.id}")).to be(true)
      expect(connection.table_exists?("test_#{own.id}.t#{own.table_definitions.first.id}")).to be(true)
    end

    it "reports the refusal from the non-bang forms once" do
      lock(own)

      expect(own.commit).to be(false)
      expect(own.errors[:base]).to eq([ "Schema lck: is locked" ])
    end

    it "refuses a revert and leaves the schema committed" do
      own.commit!
      lock(own)

      expect { own.revert_to_draft! }.to raise_error(Grit::Core::Model::DynamicSchema::CommitError, "Schema lck: is locked")
      expect(own.reload).to be_committed
      expect(connection.schema_exists?("test_lck")).to be(true)
    end

    it "refuses a drop with the reason" do
      own.update_columns(name: "Locked")

      expect(own.destroy).to be(false)
      expect { own.destroy! }.to raise_error(ActiveRecord::RecordNotDestroyed, "is locked")
      expect(connection.schema_exists?("test_#{own.id}")).to be(true)
    end

    it "counts errors added without :abort as a refusal" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "FrozenSchemaDefinition"

        def check_can_modify
          errors.add(:base, "is frozen once committed") if committed_at_in_database.present?
        end
      end
      frozen = klass.create!(identifier: "frz", name: "Frozen")
      frozen.commit!

      expect(frozen.update(name: "Renamed")).to be(false)
      expect { frozen.reload.revert_to_draft! }.to raise_error(Grit::Core::Model::DynamicSchema::CommitError, "Schema frz: is frozen once committed")
    end

    it "is the schema's alone at commit" do
      table = create_table
      create_column(table)
      allow_any_instance_of(Grit::TableDefinition).to receive(:check_can_modify) { |definition| definition.errors.add(:base, "table locked") }
      allow_any_instance_of(Grit::ColumnDefinition).to receive(:check_can_modify) { |definition| definition.errors.add(:base, "column locked") }
      expect(table).not_to be_valid

      expect { schema.commit! }.not_to raise_error
      expect(schema).to be_committed
    end
  end

  describe "blank identifier (T11)" do
    it "reports an invalid record rather than raising" do
      expect { schema.update(identifier: nil) }.not_to raise_error
      expect(schema.errors[:identifier]).to include("can't be blank")
    end
  end

  describe "a draft" do
    it "lives in a schema named after its id" do
      expect(schema).not_to be_committed
      expect(schema.physical_schema_name).to eq("test_#{schema.id}")
      expect(schema.draft_schema_name).to eq("test_#{schema.id}")
      expect(schema.committed_schema_name).to eq("test_grp")
      expect(schema.physical_schema_exists?).to be(true)
      expect(connection.schema_exists?("test_grp")).to be(false)
    end

    it "touches nothing in the database when its identifier changes" do
      table = create_table

      schema.update!(identifier: "new_grp")

      expect(schema.physical_schema_name).to eq("test_#{schema.id}")
      expect(connection.table_exists?(table.physical_table_name)).to be(true)
      expect(connection.schema_exists?("test_new_grp")).to be(false)
    end

    # The name derives from the id, so an existing schema under it belongs to something else.
    it "does not adopt a schema that is already there" do
      expect { schema.send(:create_schema) }.to raise_error(ActiveRecord::StatementInvalid, /already exists/)
    end
  end

  describe "commit!" do
    let!(:table) { create_table }
    let!(:label) { create_column(table) }
    let!(:reference) { create_column(table, "ref_col", data_type: entity_type) }

    it "moves the schema, its tables and their dynamic columns to their identifiers" do
      draft_table_name = table.physical_table_name

      schema.commit!

      expect(schema).to be_committed
      expect(schema.physical_schema_name).to eq("test_grp")
      expect(table.physical_table_name).to eq("test_grp.measures")
      expect(connection.schema_exists?("test_#{schema.id}")).to be(false)
      expect(connection.table_exists?(draft_table_name)).to be(false)
      expect(column_names("test_grp.measures"))
        .to eq(%w[id created_by created_at updated_by updated_at owner_id label ref_col])
    end

    it "keeps the data" do
      insert_draft_row(table, label: "first", ref_col: admin.id)

      schema.commit!

      row = table.record_klass.first
      expect(row["label"]).to eq("first")
      expect(row["ref_col"]).to eq(admin.id)
    end

    it "takes whatever identifiers the draft settled on" do
      table.update!(identifier: "readings")
      label.update!(identifier: "title")
      schema.update!(identifier: "lab")

      schema.commit!

      expect(column_names("test_lab.readings")).to include("title")
    end

    # Draft names are unique per definition and never valid identifiers, so identifiers can
    # trade places with nothing physical in the way.
    it "commits identifiers that traded places in the draft" do
      other = create_table("other")
      insert_draft_row(table, label: "mine")
      table.update!(identifier: "spare")
      other.update!(identifier: "measures")
      table.update!(identifier: "other")

      schema.commit!

      expect(Grit::TableDefinition.find(table.id).record_klass.first["label"]).to eq("mine")
      expect(connection.table_exists?("test_grp.measures")).to be(true)
      expect(connection.table_exists?("test_grp.other")).to be(true)
    end

    it "renames the primary key and dynamic column foreign keys after their identifiers" do
      schema.commit!

      expect(connection.foreign_keys("test_grp.measures").map(&:name).sort)
        .to eq([ table.foreign_key_name("owner_id"), table.foreign_key_name("ref_col", reference.id) ])
      expect(primary_key_index_name("test_grp.measures")).to eq(table.committed_primary_key_name)
      expect(table.committed_primary_key_name).to start_with("measures_")
    end

    it "restores the draft constraint names on revert" do
      foreign_keys = connection.foreign_keys(table.physical_table_name).map(&:name).sort
      schema.commit!

      schema.revert_to_draft!

      expect(connection.foreign_keys(table.physical_table_name).map(&:name).sort).to eq(foreign_keys)
      expect(primary_key_index_name(table.physical_table_name)).to eq(table.draft_primary_key_name)
    end

    # Tables and indexes share a namespace per schema; primary key index names are padded past
    # any identifier, so they block no table name.
    it "commits a table named like another table's primary key index" do
      create_table("measures_pkey")

      expect { schema.commit! }.not_to raise_error
      expect(connection.table_exists?("test_grp.measures_pkey")).to be(true)
    end

    it "refuses a schema that is already committed" do
      schema.commit!

      expect { schema.commit! }
        .to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /test_grp is already committed/)
    end

    # Unlike the id-based names, anything (a migration, another includer) may have created it.
    it "refuses when the readable schema name is taken" do
      connection.create_schema("test_grp")

      expect { schema.commit! }
        .to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /the schema test_grp already exists/)
      expect(schema.reload).not_to be_committed
      expect(connection.table_exists?(table.physical_table_name)).to be(true)
    end

    # Per-record validations only check an identifier when it changes, but code
    # can change the rules under a saved one.
    it "validates every identifier again, changed or not" do
      allow_any_instance_of(Grit::ColumnDefinition).to receive(:reserved_identifiers)
        .and_return(Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS + [ "label" ])

      expect { schema.commit! }
        .to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /Column measures\.label: Identifier is a reserved keyword/)
    end

    it "reports every problem at once" do
      connection.create_schema("test_grp")
      allow_any_instance_of(Grit::ColumnDefinition).to receive(:reserved_identifiers)
        .and_return(Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS + [ "label" ])

      expect { schema.commit! }.to raise_error(Grit::Core::Model::DynamicSchema::CommitError) { |error|
        expect(error.messages).to include(/the schema test_grp already exists/, /Column measures\.label/)
      }
    end

    it "refuses a definition with unsaved changes" do
      schema.name = "Unsaved"

      expect { schema.commit! }.to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /Save/)
    end

    # Fails after the schema has moved, so that there is something to undo.
    def fail_table_renames
      allow_any_instance_of(Grit::SchemaDefinition).to receive(:rename_table_objects!)
        .and_raise(ActiveRecord::StatementInvalid, "PG::InternalError: ERROR:  boom")
    end

    it "rolls everything back when a rename fails" do
      fail_table_renames

      expect { schema.commit! }
        .to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /Could not commit test_grp: PG::InternalError: ERROR:  boom/)
      expect(schema.reload).not_to be_committed
      expect(connection.schema_exists?("test_#{schema.id}")).to be(true)
      expect(connection.schema_exists?("test_grp")).to be(false)
      expect(connection.table_exists?(table.physical_table_name)).to be(true)
    end

    # `committed_at` is set in memory before the after callbacks and a rollback doesn't reset
    # it; left set, `record_klass` would point at tables that were never renamed.
    it "leaves the definition in memory a draft when the commit fails" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "FailingAfterCommitSchemaDefinition"
        after_schema_commit { raise "boom" }
      end
      own = klass.create!(identifier: "fail", name: "Failing")
      own_table = create_table(schema_definition: own)

      expect { own.commit! }.to raise_error("boom")

      expect(own).not_to be_committed
      expect(own.reload).not_to be_committed
      expect { own_table.record_klass }.to raise_error(/is a draft/)
    end

    # Runs in its own savepoint, so the non-bang form, which swallows the error, leaves no
    # half commit in the caller's transaction.
    it "rolls back on its own inside a caller's transaction" do
      fail_table_renames

      ActiveRecord::Base.transaction do
        expect(schema.commit).to be(false)
        expect(connection.schema_exists?("test_#{schema.id}")).to be(true)
        expect(connection.schema_exists?("test_grp")).to be(false)
        expect(connection.select_value("SELECT 1")).to eq(1)
      end
    end

    describe "commit" do
      it "returns true on success" do
        expect(schema.commit).to be(true)
        expect(schema).to be_committed
      end

      it "returns false and reports what stopped it" do
        connection.create_schema("test_grp")

        expect(schema.commit).to be(false)
        expect(schema.errors[:base].join).to match(/the schema test_grp already exists/)
      end
    end

    describe "callbacks" do
      let(:klass) do
        Class.new(Grit::SchemaDefinition) do
          def self.name = "CallbackSchemaDefinition"

          before_schema_commit :note_before
          after_schema_commit :note_after

          def seen
            @seen ||= []
          end

          def note_before
            seen.push([ :before, physical_schema_name ])
          end

          def note_after
            seen.push([ :after, physical_schema_name ])
          end
        end
      end

      it "runs around the renames" do
        own = klass.create!(identifier: "cbk", name: "Callbacks")

        own.commit!

        expect(own.seen).to eq([ [ :before, "test_#{own.id}" ], [ :after, "test_cbk" ] ])
      end

      it "does not share them with other includers" do
        klass
        expect(Grit::SchemaDefinition._schema_commit_callbacks.map(&:filter)).to be_empty
      end

      it "aborts the commit when a before_schema_commit callback throws :abort" do
        aborting = Class.new(Grit::SchemaDefinition) do
          def self.name = "AbortingSchemaDefinition"
          before_schema_commit { throw :abort }
        end
        own = aborting.create!(identifier: "abt", name: "Aborted")

        expect { own.commit! }.to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /aborted/)
        expect(own.reload).not_to be_committed
        expect(connection.schema_exists?("test_#{own.id}")).to be(true)
      end
    end
  end

  describe "revert_to_draft!" do
    let!(:table) { create_table }
    let!(:label) { create_column(table) }

    it "moves everything back to its id-based name and keeps the data" do
      row_id = insert_draft_row(table, label: "first")
      schema.commit!

      schema.revert_to_draft!

      expect(schema).not_to be_committed
      expect(schema.physical_schema_name).to eq("test_#{schema.id}")
      expect(table.physical_table_name).to eq("test_#{schema.id}.t#{table.id}")
      expect(column_names(table.physical_table_name)).to include("c#{label.id}")
      expect(connection.schema_exists?("test_grp")).to be(false)
      expect(draft_value(table, row_id, :label)).to eq("first")
      expect { table.record_klass }.to raise_error(/is a draft/)
    end

    it "leaves the definition in memory committed when the revert fails" do
      schema.commit!
      allow_any_instance_of(Grit::SchemaDefinition).to receive(:rename_table_objects!)
        .and_raise(ActiveRecord::StatementInvalid, "PG::InternalError: ERROR:  boom")

      expect { schema.revert_to_draft! }.to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /boom/)

      expect(schema).to be_committed
      expect(connection.table_exists?("test_grp.measures")).to be(true)
    end

    it "lets the structure change and be committed again" do
      insert_draft_row(table, label: "first")
      schema.commit!
      schema.revert_to_draft!

      label.reload.update!(identifier: "title")
      create_column(table, "notes")
      schema.commit!

      expect(column_names("test_grp.measures")).to include("title", "notes")
      expect(table.record_klass.first["title"]).to eq("first")
    end

    it "refuses a draft" do
      expect { schema.revert_to_draft! }
        .to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /is not committed/)
    end

    it "refuses when the draft schema name is taken" do
      schema.commit!
      connection.create_schema("test_#{schema.id}")

      expect { schema.revert_to_draft! }
        .to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /the schema test_#{schema.id} already exists/)
      expect(schema.reload).to be_committed
    end

    it "runs before_schema_revert and after_schema_revert around the renames" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "RevertCallbackSchemaDefinition"

        before_schema_revert { seen.push([ :before, physical_schema_name ]) }
        after_schema_revert { seen.push([ :after, physical_schema_name ]) }

        def seen
          @seen ||= []
        end
      end
      own = klass.create!(identifier: "rvt", name: "Revert")
      own.commit!

      own.revert_to_draft!

      expect(own.seen).to eq([ [ :before, "test_rvt" ], [ :after, "test_#{own.id}" ] ])
    end

    it "returns false from revert_to_draft and reports what stopped it" do
      expect(schema.revert_to_draft).to be(false)
      expect(schema.errors[:base].join).to match(/is not committed/)
    end
  end

  # A committed schema is named after its identifier.
  describe "the identifier of a committed schema" do
    before(:each) { schema.commit! }

    it "cannot change" do
      expect(schema.update(identifier: "other")).to be(false)
      expect(schema.errors[:identifier].join).to match(/cannot be changed while test_grp is committed/)
      expect(connection.schema_exists?("test_grp")).to be(true)
    end

    it "is refused by validation" do
      schema.identifier = "other"

      expect(schema).not_to be_valid
      expect { schema.save! }.to raise_error(ActiveRecord::RecordInvalid, /cannot be changed while test_grp is committed/)
    end

    # Simulates a request racing the commit, which loaded the definition while still a draft.
    it "is checked against the locked row rather than memory" do
      stale = Grit::SchemaDefinition.find(schema.id)
      stale.committed_at = nil
      stale.clear_attribute_changes([ :committed_at ])

      expect(stale.update(identifier: "other")).to be(false)
      expect(schema.reload.identifier).to eq("grp")
    end

    it "leaves the name free to change" do
      expect(schema.update(name: "Renamed")).to be(true)
    end
  end

  # Destroying a definition drops its schema with CASCADE, draft or committed.
  describe "destroy" do
    it "drops a draft schema with its tables" do
      table = create_table

      schema.destroy!

      expect(connection.schema_exists?("test_#{schema.id}")).to be(false)
      expect(Grit::TableDefinition.where(id: table.id)).not_to exist
    end

    # Its tables and columns skip the committed-schema check on the way out.
    it "drops a committed schema with its tables" do
      table = create_table
      column = create_column(table)
      schema.commit!

      schema.destroy!

      expect(connection.schema_exists?("test_grp")).to be(false)
      expect(Grit::TableDefinition.where(id: table.id)).not_to exist
      expect(Grit::ColumnDefinition.where(id: column.id)).not_to exist
    end

    # `dependent: :destroy` destroys the association as loaded, here before the table existed.
    it "drops tables added after its association was loaded" do
      expect(schema.table_definitions.size).to eq(0)
      table = create_table

      schema.destroy!

      expect(Grit::TableDefinition.where(id: table.id)).not_to exist
    end

    # Only the schema's guard is consulted, as at commit; see `Refusal`.
    it "drops tables and columns whose own guards would refuse" do
      table = create_table
      column = create_column(table)
      allow_any_instance_of(Grit::TableDefinition).to receive(:check_can_modify) { |definition| definition.errors.add(:base, "table locked") }
      allow_any_instance_of(Grit::ColumnDefinition).to receive(:check_can_modify) { |definition| definition.errors.add(:base, "column locked") }

      expect(schema.destroy).to be_truthy
      expect(connection.schema_exists?("test_#{schema.id}")).to be(false)
      expect(Grit::TableDefinition.where(id: table.id)).not_to exist
      expect(Grit::ColumnDefinition.where(id: column.id)).not_to exist
    end

    # Rails' own rollback is a no-op inside a caller's transaction, so `destroy` takes a
    # savepoint: an abort after DROP SCHEMA must still undo it.
    it "rolls back the drop when aborted after it, inside a caller's transaction" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "LateAbortSchemaDefinition"

        # Declared after the macros, so it runs after the drop and the cascade.
        before_destroy do
          errors.add(:base, "kept")
          throw :abort
        end
      end
      own = klass.create!(identifier: "lte", name: "Late")
      table = create_table(schema_definition: own)

      ActiveRecord::Base.transaction do
        expect(own.destroy).to be(false)
      end

      expect(own.errors[:base]).to eq([ "kept" ])
      expect(Grit::SchemaDefinition.where(id: own.id)).to exist
      expect(Grit::TableDefinition.where(id: table.id)).to exist
      expect(connection.schema_exists?("test_#{own.id}")).to be(true)
      expect(connection.table_exists?(table.physical_table_name)).to be(true)
    end

    it "runs before_schema_drop with the tables intact" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "DropCallbackSchemaDefinition"

        before_schema_drop :note_tables

        def seen
          @seen ||= []
        end

        def note_tables
          seen.concat(table_definitions.map { |table| ActiveRecord::Base.connection.table_exists?(table.physical_table_name) })
        end
      end
      own = klass.create!(identifier: "drp", name: "Drop")
      create_table(schema_definition: own)

      own.destroy!

      expect(own.seen).to eq([ true ])
      expect(connection.schema_exists?("test_#{own.id}")).to be(false)
    end

    it "is aborted by a before_schema_drop callback that throws :abort" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "KeptSchemaDefinition"
        before_schema_drop { throw :abort }
      end
      own = klass.create!(identifier: "kpt", name: "Kept")

      expect(own.destroy).to be(false)
      expect(own.errors[:base]).to eq([ "A before_schema_drop callback aborted the drop" ])
      expect { own.destroy! }.to raise_error(ActiveRecord::RecordNotDestroyed, "A before_schema_drop callback aborted the drop")
      expect(connection.schema_exists?("test_#{own.id}")).to be(true)
      expect(Grit::SchemaDefinition.where(id: own.id)).to exist
    end

    # A refused rename leaves the other definition's identifier in memory, and DROP SCHEMA
    # cascades, so the drop must use the locked row's.
    it "drops its own committed schema, not the one a refused rename names" do
      other = Grit::SchemaDefinition.create!(identifier: "other", name: "Other")
      create_table(schema_definition: other)
      other.commit!
      schema.commit!

      expect(schema.update(identifier: "other")).to be(false)
      schema.destroy!

      expect(connection.schema_exists?("test_grp")).to be(false)
      expect(connection.table_exists?("test_other.measures")).to be(true)
    end

    # Destroy callbacks run on a record that was never saved.
    it "drops nothing when destroyed before it was saved" do
      schema

      Grit::SchemaDefinition.new(identifier: "grp", name: "Clash").destroy

      expect(connection.schema_exists?("test_#{schema.id}")).to be(true)
    end
  end

  describe "schema_name_available" do
    it "rejects an identifier a sibling holds" do
      schema

      clash = Grit::SchemaDefinition.new(identifier: "grp", name: "Twin")

      expect(clash).not_to be_valid
      expect(clash.errors[:identifier].join).to match(/another definition resolves to the schema test_grp/)
    end

    it "refuses to rename onto an identifier a sibling holds" do
      schema
      other = Grit::SchemaDefinition.create!(identifier: "oth", name: "Other")

      expect(other.update(identifier: "grp")).to be(false)
      expect(other.errors[:identifier].join).to match(/another definition resolves to the schema/)
    end

    # Only checked on commit: a draft lives under a name nothing else can hold.
    it "does not consult the catalog for a draft" do
      connection.create_schema("test_taken")

      expect(Grit::SchemaDefinition.new(identifier: "taken", name: "Taken")).to be_valid
    end

    it "rejects an identifier resolving onto a schema PostgreSQL reserves" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "UnprefixedSchemaDefinition"

        def committed_schema_name
          identifier.to_s
        end
      end

      expect(klass.new(identifier: "public", name: "Public")).not_to be_valid
      expect(klass.new(identifier: "pg_temp_1", name: "Temp")).not_to be_valid
    end

    it "leaves a definition alone when its identifier is not moving" do
      expect(schema.update(name: "Renamed")).to be(true)
    end

    # Compared on the resolved name: under another prefix the same identifier is another schema.
    it "allows a sibling identifier that resolves to another schema" do
      declare_schema_prefix("othr")
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "OtherPrefixSchemaDefinition"
        dynamic_schema_prefix "othr"
      end
      schema

      expect(klass.new(identifier: "grp", name: "Elsewhere")).to be_valid
    end

    # Closes the race the validation can't; the concern tells includers to add this index.
    it "is backed by a unique index on identifier" do
      index_names = connection.indexes("test_schema_definitions").select(&:unique).map { |i| Array(i.columns) }

      expect(index_names).to include([ "identifier" ])
    end
  end

  describe "dynamic_schema_prefix" do
    # Otherwise it would only show up on commit, as a truncated schema name.
    it "rejects an over-long prefix at class definition time" do
      expect {
        Class.new(ApplicationRecord) do
          def self.name = "OverLongPrefixSchemaDefinition"
          self.table_name = "test_schema_definitions"
          include Grit::Core::Model::DynamicSchema::SchemaDefinition
          dynamic_schema_prefix "a" * (Grit::Core::Model::DynamicSchema::SchemaDefinition::MAX_SCHEMA_PREFIX_LENGTH + 1)
        end
      }.to raise_error(ArgumentError, /at most 32/)
    end

    # `class_attribute` defines a public writer whether or not the macro is used, so the
    # checks live on the writer.
    it "applies the same checks to a direct schema_prefix assignment" do
      expect {
        Class.new(ApplicationRecord) do
          def self.name = "DirectPrefixSchemaDefinition"
          self.table_name = "test_schema_definitions"
          include Grit::Core::Model::DynamicSchema::SchemaDefinition
          self.schema_prefix = "Bad-Prefix"
        end
      }.to raise_error(ArgumentError, /lowercase letters/)

      expect {
        Class.new(ApplicationRecord) do
          def self.name = "DirectOverLongPrefixSchemaDefinition"
          self.table_name = "test_schema_definitions"
          include Grit::Core::Model::DynamicSchema::SchemaDefinition
          self.schema_prefix = "a" * (Grit::Core::Model::DynamicSchema::SchemaDefinition::MAX_SCHEMA_PREFIX_LENGTH + 1)
        end
      }.to raise_error(ArgumentError, /at most 32/)
    end

    it "cannot be set on a single record" do
      expect(Grit::SchemaDefinition.new).not_to respond_to(:schema_prefix=)
      expect { Grit::SchemaDefinition.new(identifier: "x", name: "X", schema_prefix: "foo") }
        .to raise_error(ActiveModel::UnknownAttributeError)
    end

    # Without the macro `schema_prefix` is nil and schemas would be `_<id>`, invisible to the
    # structure-dump exclusion. Checked on the record, since the class-time check only runs
    # when the macro does.
    it "refuses to save an includer that never declared a prefix" do
      klass = Class.new(ApplicationRecord) do
        def self.name = "Grit::PrefixlessSchemaDefinition"
        self.table_name = "test_schema_definitions"
        include Grit::Core::Model::DynamicSchema::SchemaDefinition
      end

      prefixless = klass.new(identifier: "grp", name: "Schema")

      expect(prefixless).not_to be_valid
      expect(prefixless.errors[:base].join).to match(/must declare a dynamic_schema_prefix/)
      expect(prefixless.save).to be(false)
    end

    it "rejects a malformed prefix at class definition time" do
      expect {
        Class.new(ApplicationRecord) do
          def self.name = "MalformedPrefixSchemaDefinition"
          self.table_name = "test_schema_definitions"
          include Grit::Core::Model::DynamicSchema::SchemaDefinition
          dynamic_schema_prefix "Test-Prefix"
        end
      }.to raise_error(ArgumentError, /lowercase letters/)
    end

    # structure.sql only excludes the prefixes in config, so its schemas would be dumped.
    it "rejects a prefix missing from config.grit.dynamic_schema_prefixes" do
      expect {
        Class.new(ApplicationRecord) do
          def self.name = "UndeclaredPrefixSchemaDefinition"
          self.table_name = "test_schema_definitions"
          include Grit::Core::Model::DynamicSchema::SchemaDefinition
          dynamic_schema_prefix "undeclared"
        end
      }.to raise_error(ArgumentError, /"undeclared" is not declared; add it to config\.grit\.dynamic_schema_prefixes in the engine or app that defines UndeclaredPrefixSchemaDefinition/)
    end

    it "accepts a prefix declared in config" do
      declare_schema_prefix("declared")

      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "DeclaredPrefixSchemaDefinition"
        dynamic_schema_prefix "declared"
      end

      own = klass.create!(identifier: "grp", name: "Schema")
      expect(own.physical_schema_name).to eq("declared_#{own.id}")
      expect(own.committed_schema_name).to eq("declared_grp")
    end

    # Max prefix + `_` + max identifier is exactly 63 bytes, PostgreSQL's identifier limit;
    # the name must reach the catalog untruncated.
    it "accepts a prefix at the limit and commits a schema with it" do
      max_prefix = Grit::Core::Model::DynamicSchema::SchemaDefinition::MAX_SCHEMA_PREFIX_LENGTH
      max_identifier = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
      declare_schema_prefix("p" * max_prefix)
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "WidestSchemaDefinition"
        dynamic_schema_prefix "p" * Grit::Core::Model::DynamicSchema::SchemaDefinition::MAX_SCHEMA_PREFIX_LENGTH
      end

      widest = klass.create!(identifier: "g" * max_identifier, name: "Schema")
      widest.commit!

      expect(widest.physical_schema_name.bytesize).to eq(63)
      expect(widest.physical_schema_name).to eq("#{'p' * max_prefix}_#{'g' * max_identifier}")
      expect(connection.schema_names).to include(widest.physical_schema_name)
    end
  end
end
