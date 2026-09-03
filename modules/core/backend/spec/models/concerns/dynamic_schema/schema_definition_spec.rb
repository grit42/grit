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

# Tests for the DynamicSchema::SchemaDefinition concern, exercised through the
# Grit::SchemaDefinition dummy model.
RSpec.describe "DynamicSchema::SchemaDefinition concern", type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }

  before(:each) do
    set_current_user(admin)
  end

  def connection
    ActiveRecord::Base.connection
  end

  # T1 — instance methods live in the module body, so an includer can name its
  # association `table_definitions` (the concern's own accessor name) without
  # the accessor recursing into itself.
  describe "natural-name association (T1)" do
    it "reads the association rather than recursing" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      expect(schema.table_definitions.to_a).to eq([])
    end

    it "sees table definitions added to the association" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(schema.table_definitions.reload.to_a).to eq([ table ])
    end
  end

  # T2 — check_can_modify is a no-op by default, and overridable via `super`.
  describe "check_can_modify default guard (T2)" do
    it "allows create, update and destroy" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
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

  # ==========================================================================
  # T10 — callback lists and destroy wiring
  # ==========================================================================

  describe "table callbacks (T10)" do
    def callback_klass(name, &body)
      Class.new(Grit::SchemaDefinition) do
        define_singleton_method(:name) { name }
        class_eval(&body)
      end
    end

    it "does not share callback lists between includers" do
      first = callback_klass("Grit::FirstSchemaDefinition") do
        before_drop_tables :note_first
        after_create_tables :note_first_created

        def note_first; end
        def note_first_created; end
      end

      second = callback_klass("Grit::SecondSchemaDefinition") do
        before_drop_tables :note_second

        def note_second; end
      end

      expect(first.before_drop_tables_callbacks).to eq([ :note_first ])
      expect(second.before_drop_tables_callbacks).to eq([ :note_second ])
      expect(Grit::SchemaDefinition.before_drop_tables_callbacks).to eq([])
      expect(Grit::SchemaDefinition.after_create_tables_callbacks).to eq([])
    end

    it "appends rather than replacing" do
      klass = callback_klass("Grit::AppendingSchemaDefinition") do
        before_drop_tables :first_hook
        before_drop_tables :second_hook

        def first_hook; end
        def second_hook; end
      end

      expect(klass.before_drop_tables_callbacks).to eq([ :first_hook, :second_hook ])
    end

    it "runs after_create_tables callbacks from create_tables" do
      klass = callback_klass("Grit::AfterCreateSchemaDefinition") do
        after_create_tables :record_created

        def record_created
          (@calls ||= []) << :created
        end

        attr_reader :calls
      end

      schema = klass.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      schema.create_tables

      expect(schema.calls).to eq([ :created ])
    end

    it "runs before_drop_tables callbacks on destroy, while the tables still exist" do
      klass = callback_klass("Grit::BeforeDropSchemaDefinition") do
        before_drop_tables :record_tables

        def record_tables
          @seen = table_definitions.map(&:table_name)
        end

        attr_reader :seen
      end

      schema = klass.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(ActiveRecord::Base.connection.table_exists?("test_grp.tbl")).to be(true)

      schema.destroy!

      expect(schema.seen).to eq([ "test_grp.tbl" ])
      expect(ActiveRecord::Base.connection.table_exists?("test_grp.tbl")).to be(false)
    end

    it "drops the tables on destroy even with no callbacks registered" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      schema.destroy!

      expect(ActiveRecord::Base.connection.table_exists?("test_grp.tbl")).to be(false)
    end
  end

  # ==========================================================================
  # T11 — blank identifier on update
  # ==========================================================================

  describe "blank identifier (T11)" do
    it "reports an invalid record rather than raising" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")

      expect { schema.update(identifier: nil) }.not_to raise_error
      expect(schema.errors[:identifier]).to include("can't be blank")
    end
  end

  # ==========================================================================
  # create_tables / drop_tables as a schema-level operation
  #
  # T5 made deferring creation supported, which is what `create_tables` is for:
  # build the whole schema's definitions first, materialise them in one go once
  # the schema is settled. Note that `create_tables` calls `create_table`
  # unconditionally — `create_table_on_create?` guards the `after_create` hook
  # only, and does not veto an explicit request.
  # ==========================================================================

  describe "create_tables and drop_tables" do
    let(:deferred_klass) do
      Class.new(Grit::TableDefinition) do
        def self.name = "Grit::DeferredSchemaTableDefinition"

        def create_table_on_create?
          false
        end
      end
    end

    it "materialises a schema of deferred definitions in one go" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      deferred_klass.create!(identifier: "one", name: "One", schema_definition: schema)
      deferred_klass.create!(identifier: "two", name: "Two", schema_definition: schema)
      expect(ActiveRecord::Base.connection.table_exists?("test_grp.one")).to be(false)

      schema.create_tables

      expect(ActiveRecord::Base.connection.table_exists?("test_grp.one")).to be(true)
      expect(ActiveRecord::Base.connection.table_exists?("test_grp.two")).to be(true)
    end

    it "creates a deferred table even though create_table_on_create? is false" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      table = deferred_klass.create!(identifier: "one", name: "One", schema_definition: schema)

      schema.create_tables

      expect(ActiveRecord::Base.connection.table_exists?(table.table_name)).to be(true)
    end

    it "drops the tables without destroying their definitions" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      table = Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)

      schema.drop_tables

      expect(ActiveRecord::Base.connection.table_exists?("test_grp.one")).to be(false)
      expect(table.reload).to be_persisted
    end

    it "is safe to run either way round more than once" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)

      expect {
        schema.create_tables
        schema.drop_tables
        schema.drop_tables
        schema.create_tables
      }.not_to raise_error

      expect(ActiveRecord::Base.connection.table_exists?("test_grp.one")).to be(true)
    end

    # One transaction for the whole schema. Each `TableDefinition#create_table`
    # opens its own, which joins this one rather than committing on its own, so a
    # publish that dies half way leaves nothing behind — not six tables committed,
    # four missing and `after_create_tables_callbacks` unrun while the definition
    # still says it published.
    # `table_definitions` re-instantiates its rows as Grit::TableDefinition, so a
    # subclass override of `create_table` never runs from here. The failure has to
    # be installed on the class the association builds.
    def fail_create_table_for(identifier)
      allow_any_instance_of(Grit::TableDefinition).to receive(:create_table).and_wrap_original do |original, *args|
        raise "boom" if original.receiver.identifier == identifier
        original.call(*args)
      end
    end

    it "materialises all of the tables or none of them" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      deferred_klass.create!(identifier: "one", name: "One", schema_definition: schema)
      deferred_klass.create!(identifier: "two", name: "Two", schema_definition: schema)
      fail_create_table_for("two")

      expect { schema.create_tables }.to raise_error("boom")

      expect(connection.table_exists?("test_grp.one")).to be(false)
      expect(connection.table_exists?("test_grp.two")).to be(false)
    end

    it "does not run the after_create_tables callbacks when a table fails" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "PartialCreateSchemaDefinition"
        after_create_tables :record_created

        def created_ran
          @created_ran ||= []
        end

        def record_created
          created_ran.push(:created)
        end
      end

      schema = klass.create!(identifier: "grp", name: "Schema")
      deferred_klass.create!(identifier: "one", name: "One", schema_definition: schema)
      fail_create_table_for("one")

      expect { schema.create_tables }.to raise_error("boom")
      expect(schema.created_ran).to eq([])
    end
  end

  # ==========================================================================
  # Destroying a schema definition
  #
  # `DROP SCHEMA ... CASCADE` — which is what `drop_schema` emits, `if_exists`
  # toggling only the IF EXISTS — removes every table in the schema by itself. The
  # `dependent: :destroy` on the table definitions issues a DROP TABLE apiece on
  # top of that, which is worth keeping for the `check_can_modify` guard it runs.
  # A third pass, from `drop_tables` registered as a `before_destroy`, is not.
  # ==========================================================================

  describe "destroy" do
    it "drops each table once, not once per callback path" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)
      Grit::TableDefinition.create!(identifier: "two", name: "Two", schema_definition: schema)

      dropped = []
      allow(connection).to receive(:drop_table).and_wrap_original do |original, table_name, **options|
        dropped.push(table_name)
        original.call(table_name, **options)
      end

      schema.destroy!

      expect(dropped).to contain_exactly("test_grp.one", "test_grp.two")
    end

    # The callbacks are why `drop_tables` was on the destroy path at all; they
    # still have to run, and still while the tables are there to be read.
    it "still runs the before_drop_tables callbacks, with the tables intact" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "DestroyCallbackSchemaDefinition"
        before_drop_tables :note_tables

        def seen
          @seen ||= []
        end

        def note_tables
          seen.push(ActiveRecord::Base.connection.table_exists?("test_grp.one"))
        end
      end

      schema = klass.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)

      schema.destroy!

      expect(schema.seen).to eq([ true ])
      expect(connection.schema_exists?("test_grp")).to be(false)
    end

    # `drop_tables` stays a public, callable thing — it is half of the
    # create_tables/drop_tables pair — it simply is not what destroy runs.
    it "leaves drop_tables usable on its own" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)

      schema.drop_tables

      expect(connection.table_exists?("test_grp.one")).to be(false)
      expect(connection.schema_exists?("test_grp")).to be(true)
    end
  end

  # ==========================================================================
  # the schema itself
  # ==========================================================================

  describe "the schema" do
    it "is created with the definition" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")

      expect(schema.schema_name).to eq("test_grp")
      expect(schema.schema_exists?).to be(true)
    end

    # Eagerly, even when the tables are deferred: an empty schema costs nothing,
    # and it means `create_table` never has to wonder whether its schema is there.
    it "is created even when table creation is deferred" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "EmptySchemaDefinition"
      end

      expect(klass.create!(identifier: "grp", name: "Schema").schema_exists?).to be(true)
    end

    it "is created idempotently" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")

      expect { schema.create_schema }.not_to raise_error
      expect(schema.schema_exists?).to be(true)
    end

    it "goes with the definition on destroy" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      schema.destroy!

      expect(connection.schema_exists?("test_grp")).to be(false)
    end

    # `drop_tables` is the unpublish hook; the schema is the definition's, and
    # only the definition going away takes it.
    it "survives drop_tables" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      schema.drop_tables

      expect(connection.table_exists?("test_grp.tbl")).to be(false)
      expect(schema.schema_exists?).to be(true)
    end

    it "is rebuilt by create_tables when it is not there" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      connection.drop_schema("test_grp", if_exists: true)

      schema.create_tables

      expect(schema.schema_exists?).to be(true)
      expect(connection.table_exists?("test_grp.tbl")).to be(true)
    end
  end

  # ==========================================================================
  # schema names are database-wide
  #
  # Unlike a table name under the old prefix scheme, a PostgreSQL schema name is
  # not scoped to the definition table the row came from — two includers compete
  # for one namespace, and no uniqueness validation or unique index can see
  # across them. So the catalog is consulted.
  #
  # But the catalog alone is not enough, which is what the sibling check below is
  # for: it only knows what exists *now*. A schema dropped out of band, or two
  # creates racing, leaves it seeing nothing while a sibling row already owns the
  # name — and `create_schema` passes `if_not_exists: true`, so the second
  # definition adopts the first's schema without a word. Destroying either then
  # runs DROP SCHEMA ... CASCADE over the other's tables.
  # ==========================================================================

  describe "schema_name_available" do
    it "rejects an identifier whose schema already exists" do
      Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")

      clash = Grit::SchemaDefinition.new(identifier: "grp", name: "Twin")

      expect(clash).not_to be_valid
      expect(clash.errors[:identifier].join).to include("test_grp")
    end

    it "rejects a schema created out of band by anything else" do
      connection.create_schema("test_taken", if_not_exists: true)

      clash = Grit::SchemaDefinition.new(identifier: "taken", name: "Taken")

      expect(clash).not_to be_valid
      expect(clash.errors[:identifier].join).to include("already exists")
    end

    it "rejects an identifier resolving onto a schema PostgreSQL reserves" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "UnprefixedSchemaDefinition"
        self.schema_prefix = nil

        def schema_name_for(schema_definition_identifier = nil)
          (schema_definition_identifier || identifier).to_s
        end
      end

      expect(klass.new(identifier: "public", name: "Public")).not_to be_valid
      expect(klass.new(identifier: "pg_temp_1", name: "Temp")).not_to be_valid
    end

    it "leaves a definition alone when its identifier is not moving" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")

      expect(schema.update(name: "Renamed")).to be(true)
    end

    # The case the catalog cannot see. Without the sibling check both rows resolve
    # to test_grp, and `schema.destroy` takes the survivor's tables with it.
    it "rejects an identifier a sibling owns even with the schema gone" do
      Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      connection.drop_schema("test_grp", if_exists: true)

      clash = Grit::SchemaDefinition.new(identifier: "grp", name: "Twin")

      expect(connection.schema_exists?("test_grp")).to be(false)
      expect(clash).not_to be_valid
      expect(clash.errors[:identifier].join).to match(/another definition resolves to the schema test_grp/)
    end

    it "refuses to rename onto an identifier a sibling owns" do
      Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      other = Grit::SchemaDefinition.create!(identifier: "oth", name: "Other")
      connection.drop_schema("test_grp", if_exists: true)

      expect(other.update(identifier: "grp")).to be(false)
      expect(other.errors[:identifier].join).to match(/another definition resolves to the schema/)
    end

    # Compared on the resolved name, not on the identifier: a subclass may declare
    # a different prefix, and then the same identifier is a different schema.
    it "allows a sibling identifier that resolves to another schema" do
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "OtherPrefixSchemaDefinition"
        dynamic_schema_prefix "othr"
      end
      Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")

      expect(klass.new(identifier: "grp", name: "Elsewhere")).to be_valid
    end

    # Belt and braces for the race the validation cannot close on its own; the
    # concern tells includers to add this index and the dummy migration has one.
    it "is backed by a unique index on identifier" do
      index_names = connection.indexes("test_schema_definitions").select(&:unique).map { |i| Array(i.columns) }

      expect(index_names).to include([ "identifier" ])
    end
  end

  # ==========================================================================
  # rename_schema
  # ==========================================================================

  describe "rename_schema" do
    it "does nothing when the identifier did not change" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)

      schema.update!(name: "Renamed")

      expect(connection.table_exists?("test_grp.one")).to be(true)
    end

    # One ALTER SCHEMA, rather than a rename per table: the tables are not named
    # after the schema, so they come along without being touched.
    it "carries the schema's tables to the new name" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)
      Grit::TableDefinition.create!(identifier: "two", name: "Two", schema_definition: schema)

      schema.update!(identifier: "new_grp")

      expect(connection.schema_exists?("test_grp")).to be(false)
      expect(connection.table_exists?("test_grp.one")).to be(false)
      expect(connection.table_exists?("test_new_grp.one")).to be(true)
      expect(connection.table_exists?("test_new_grp.two")).to be(true)
    end

    it "leaves the schema cache describing the tables at their new name" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      table = Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)
      # Warm the cache under the old name.
      expect(table.record_klass.column_names).to include("id")

      schema.update!(identifier: "new_grp")

      expect(table.reload.record_klass.column_names).to include("id")
      expect(table.record_klass.count).to eq(0)
    end

    # The collision this used to have to reason about table by table — a schema
    # rename moves every table at once, so no table definition is saved and none
    # of their validations run. It is caught one level up now, because the schema
    # name itself is taken.
    it "refuses a rename onto a schema that already exists" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      other = Grit::SchemaDefinition.create!(identifier: "other", name: "Other")
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: other)

      expect(schema.update(identifier: "other")).to be(false)
      expect(schema.errors[:identifier].join).to include("test_other")

      expect(connection.table_exists?("test_grp.one")).to be(true)
      expect(connection.table_exists?("test_other.one")).to be(true)
    end

    it "allows a rename onto a name nothing holds" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      other = Grit::SchemaDefinition.create!(identifier: "other", name: "Other")
      Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)
      Grit::TableDefinition.create!(identifier: "two", name: "Two", schema_definition: other)

      expect(schema.update(identifier: "third")).to be(true)
      expect(connection.table_exists?("test_third.one")).to be(true)
      expect(connection.table_exists?("test_other.two")).to be(true)
    end

    it "is a no-op when the schema was never materialised" do
      schema = Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema")
      connection.drop_schema("test_grp", if_exists: true)

      expect { schema.update!(identifier: "new_grp") }.not_to raise_error
      expect(schema.reload.identifier).to eq("new_grp")
    end
  end

  # ==========================================================================
  # the schema prefix
  #
  # Validated at class-definition time rather than on save: an over-long prefix
  # would otherwise only show up as a truncated schema name inside the
  # `after_create`, leaving a definition row behind pointing at the wrong schema.
  # ==========================================================================

  describe "dynamic_schema_prefix" do
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

    # `class_attribute` hands out a public writer whether or not anyone uses the
    # macro, so the checks have to sit on the writer rather than on the macro.
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

    # The macro is optional and `schema_prefix` defaults to nil, so a class that
    # forgets it used to build `_<identifier>` schemas — which `schema_name_available`
    # waves through, and which the structure-dump exclusion cannot see either,
    # because nothing ever registered a prefix for it. Caught on the record rather
    # than at class-definition time, which is the one check `SchemaPrefixWriter`
    # cannot make: the macro may simply never run.
    it "refuses to save an includer that never declared a prefix" do
      klass = Class.new(ApplicationRecord) do
        def self.name = "Grit::PrefixlessSchemaDefinition"
        self.table_name = "test_schema_definitions"
        include Grit::Core::Model::DynamicSchema::SchemaDefinition
      end

      schema = klass.new(identifier: "grp", name: "Schema")

      expect(schema).not_to be_valid
      expect(schema.errors[:base].join).to match(/must declare a dynamic_schema_prefix/)
      expect(schema.save).to be(false)
      expect(ActiveRecord::Base.connection.schema_exists?("_grp")).to be(false)
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

    # A maximum prefix and a maximum identifier compose to exactly 63 bytes,
    # PostgreSQL's limit for one identifier, and have to reach the catalog whole.
    it "accepts a prefix at the limit and names a schema with it" do
      max_prefix = Grit::Core::Model::DynamicSchema::SchemaDefinition::MAX_SCHEMA_PREFIX_LENGTH
      max_identifier = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
      klass = Class.new(Grit::SchemaDefinition) do
        def self.name = "WidestSchemaDefinition"
        dynamic_schema_prefix "p" * Grit::Core::Model::DynamicSchema::SchemaDefinition::MAX_SCHEMA_PREFIX_LENGTH
      end

      schema = klass.create!(identifier: "g" * max_identifier, name: "Schema")

      expect(schema.schema_name.bytesize).to eq(63)
      expect(schema.schema_name).to eq("#{'p' * max_prefix}_#{'g' * max_identifier}")
      expect(connection.schema_names).to include(schema.schema_name)
    end
  end
end
