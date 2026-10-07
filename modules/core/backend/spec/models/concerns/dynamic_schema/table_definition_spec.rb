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

# Exercised through the Grit::TableDefinition dummy model against real DDL; PostgreSQL's
# transactional DDL plus `use_transactional_fixtures` rolls it back per example.
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

  # An includer can name its associations after the concern's own accessors
  # (`column_definitions`, `schema_definition`) without them recursing.
  describe "natural-name associations (T1)" do
    it "reads the associations rather than recursing" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(table.schema_definition).to eq(schema)
      expect(table.column_definitions.to_a).to eq([])
    end

    it "composes table_name from both associations" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      expect(table.table_name).to eq("test_#{schema.id}.t#{table.id}")

      schema.commit!

      expect(table.table_name).to eq("test_grp.tbl")
    end
  end

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

    it "refuses a save through errors and a destroy with the reason" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "LockedTableDefinition"

        def check_can_modify
          super
          errors.add(:base, "is locked")
        end
      end
      locked = klass.find(table.id)

      expect(locked).not_to be_valid
      expect { locked.update!(name: "Renamed") }.to raise_error(ActiveRecord::RecordInvalid, /is locked/)
      expect(locked.destroy).to be(false)
      expect { locked.destroy! }.to raise_error(ActiveRecord::RecordNotDestroyed, "is locked")
      expect(connection.table_exists?(table.table_name)).to be(true)
    end

    it "gives a refusal without a message a generic one" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "SilentTableDefinition"

        def check_can_modify
          throw :abort
        end
      end
      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table.save).to be(false)
      expect(table.errors[:base]).to eq([ "Silent table definition tbl cannot be modified" ])
    end
  end

  # Lets a plain includer that declares no implementation columns still create its table.
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
      expect(connection.table_exists?(table.table_name)).to be(true)
    end
  end

  describe "the draft table" do
    it "is built on create, under the definition's id" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table.table_name).to eq("test_#{schema.id}.t#{table.id}")
      expect(table.draft_table_name).to eq(table.table_name)
      expect(table.committed_table_name).to eq("test_grp.tbl")
      expect(connection.columns(table.table_name).map(&:name))
        .to eq(%w[id created_by created_at updated_by updated_at owner_id])
    end

    it "stays where it is when the identifier changes" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      table.update!(identifier: "new_tbl")

      expect(table.table_name).to eq("test_#{schema.id}.t#{table.id}")
      expect(connection.table_exists?(table.table_name)).to be(true)
    end

    # The name derives from the id, so a table already under it belongs to something else.
    it "does not adopt a table that is already there" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      expect { table.create_table }.to raise_error(ActiveRecord::StatementInvalid, /already exists/)
    end
  end

  describe "unique table identifiers (T15)" do
    it "rejects a duplicate identifier within one schema" do
      Grit::TableDefinition.create!(identifier: "tbl", name: "One", schema_definition: schema)

      clash = Grit::TableDefinition.new(identifier: "tbl", name: "Two", schema_definition: schema)

      expect(clash).not_to be_valid
      expect(clash.errors[:identifier].join).to match(/already taken by another table of this schema/)
    end

    it "allows the same table identifier under differently named schemas" do
      other_schema = Grit::SchemaDefinition.create!(identifier: "other", name: "Other")
      Grit::TableDefinition.create!(identifier: "tbl", name: "One", schema_definition: schema)

      expect(Grit::TableDefinition.new(identifier: "tbl", name: "Two", schema_definition: other_schema)).to be_valid
    end

    # Underscored identifiers that would collide if concatenated ("gr" + "p_tbl", "gr_p" + "tbl")
    # stay apart once schema-qualified.
    it "keeps identifiers that would once have concatenated onto one name apart" do
      first_schema = Grit::SchemaDefinition.create!(identifier: "gr", name: "Schema")
      second_schema = Grit::SchemaDefinition.create!(identifier: "gr_p", name: "Schema P")
      first = Grit::TableDefinition.create!(identifier: "p_tbl", name: "One", schema_definition: first_schema)
      second = Grit::TableDefinition.create!(identifier: "tbl", name: "Two", schema_definition: second_schema)

      first_schema.commit!
      second_schema.commit!

      expect(first.table_name).to eq("test_gr.p_tbl")
      expect(second.table_name).to eq("test_gr_p.tbl")
      expect(connection.table_exists?(first.table_name)).to be(true)
      expect(connection.table_exists?(second.table_name)).to be(true)
    end

    it "lets a definition be updated without colliding with itself" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      expect { table.update!(name: "Renamed") }.not_to raise_error
    end

    # Draft tables are named by id, so validation passes; a stray table under the committed name
    # fails the commit rather than being adopted.
    it "leaves a table something else built under the name to the commit" do
      table = Grit::TableDefinition.create!(identifier: "orphan", name: "Orphan", schema_definition: schema)
      connection.execute("CREATE TABLE #{schema.schema_name}.orphan (id bigint PRIMARY KEY)")

      expect(table).to be_valid
      expect { schema.commit! }
        .to raise_error(Grit::Core::Model::DynamicSchema::CommitError, /Could not commit test_grp: .*already exists/)
    end
  end

  # ==========================================================================
  # Reparenting, and validating without a schema
  # ==========================================================================

  describe "schema_definition_unchanged" do
    # The physical table doesn't move with the definition, so a reparented one would point at a
    # table its schema lacks, and destroying the old schema would drop it.
    it "refuses to move a table definition to another schema" do
      other_schema = Grit::SchemaDefinition.create!(identifier: "other", name: "Other")
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table.update(schema_definition: other_schema)).to be(false)
      expect(table.errors[:base].join).to match(/cannot be moved to another schema/)
      expect(table.reload.schema_definition_id).to eq(schema.id)
      expect(connection.table_exists?(table.table_name)).to be(true)
    end

    it "leaves an unrelated update alone" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table.update(name: "Renamed")).to be(true)
    end
  end

  describe "validating without a schema" do
    # `identifier_unique_in_schema` runs before the `belongs_to` presence check and reaches
    # `schema_definition.schema_name`, so it must cope with a missing schema.
    it "reports a missing schema rather than raising" do
      table = Grit::TableDefinition.new(identifier: "tbl", name: "Table", schema_definition_id: -1)

      expect { table.valid? }.not_to raise_error
      expect(table).not_to be_valid
      expect(table.errors[:schema_definition]).to include("must exist")
    end
  end

  # ==========================================================================
  # Committed tables keep their structure until reverted to draft
  # ==========================================================================

  describe "the tables of a committed schema" do
    let!(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    before(:each) { schema.commit! }

    it "refuses a new table" do
      added = Grit::TableDefinition.new(identifier: "other", name: "Other", schema_definition: schema)

      expect(added.save).to be(false)
      expect(added.errors[:base].join).to match(/test_grp is committed: revert it to draft to change its structure/)
    end

    it "refuses an identifier change" do
      expect(table.update(identifier: "new_tbl")).to be(false)
      expect(table.reload.identifier).to eq("tbl")
      expect(connection.table_exists?("test_grp.tbl")).to be(true)
    end

    it "refuses to be destroyed" do
      expect(table.destroy).to be(false)
      expect(connection.table_exists?("test_grp.tbl")).to be(true)
    end

    it "says why from the bang forms" do
      table.identifier = "new_tbl"

      expect(table).not_to be_valid
      expect { table.save! }.to raise_error(ActiveRecord::RecordInvalid, /test_grp is committed/)
      expect { table.reload.destroy! }.to raise_error(ActiveRecord::RecordNotDestroyed, /test_grp is committed/)
    end

    it "lets the name and sort change" do
      expect(table.update(name: "Renamed", sort: 3)).to be(true)
    end

    # A request racing the commit, which loaded the definitions while the schema was a draft.
    it "reads the committed state from the locked row rather than memory" do
      stale = Grit::TableDefinition.find(table.id)
      stale.schema_definition.committed_at = nil

      expect(stale.update(identifier: "new_tbl")).to be(false)
      expect(connection.table_exists?("test_grp.tbl")).to be(true)
    end
  end

  describe "record_klass and the schema cache (T7)" do
    def warm_schema_cache(table_name)
      ActiveRecord::Base.connection_pool.schema_cache.columns(table_name).map(&:name)
    end

    it "raises while the schema is a draft" do
      table = Grit::TableDefinition.create!(identifier: "t_draft", name: "Table", schema_definition: schema)

      expect { table.record_klass }
        .to raise_error(RuntimeError, "t_draft is a draft: commit test_grp before reading or writing its tables")
    end

    # As another process or a rolled-back transaction leaves it: the table changed, but this
    # process's schema cache still holds the old shape.
    it "sees the table as it is now, whatever the cache held" do
      table = Grit::TableDefinition.create!(identifier: "t_stale", name: "Table", schema_definition: schema)
      schema.commit!
      expect(warm_schema_cache(table.table_name)).not_to include("late_col")

      connection.add_column table.table_name, "late_col", :string

      expect(table.record_klass.column_names).to include("late_col")
    end

    it "sees what a revert, a change and a recommit did to the table" do
      table = Grit::TableDefinition.create!(identifier: "t_moved", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "some_col", name: "Some", data_type: string_type, table_definition: table)
      schema.commit!
      expect(table.record_klass.columns_hash["some_col"].type).to eq(:string)

      schema.revert_to_draft!
      column.update!(data_type: create(:grit_core_data_type, :integer))
      schema.commit!

      expect(table.record_klass.table_name).to eq("test_grp.t_moved")
      expect(table.record_klass.columns_hash["some_col"].type).to eq(:integer)
    end
  end

  # Prepared statements are keyed by their SQL, on every connection. Untagged, a statement
  # prepared before a revert is reused after a recommit that changed the columns, which
  # PostgreSQL refuses ("cached plan must not change result type"), for good inside a
  # transaction.
  describe "record_klass query generations" do
    let!(:table) { Grit::TableDefinition.create!(identifier: "t_gen", name: "Table", schema_definition: schema) }

    def statements
      captured = []
      subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*, payload|
        captured.push(payload[:sql]) unless payload[:name] == "SCHEMA"
      end
      yield
      captured
    ensure
      ActiveSupport::Notifications.unsubscribe(subscriber)
    end

    it "tags every query with the commit" do
      schema.commit!
      tag = "/* test_grp.t_gen #{schema.reload.committed_at.utc.iso8601(6)} */"
      klass = table.record_klass
      row = klass.create!

      sql = statements do
        klass.find(row.id)
        klass.find_by(owner_id: nil)
        klass.where(owner_id: nil).to_a
        klass.detailed.to_a
        row.reload
      end

      expect(sql).not_to be_empty
      expect(sql).to all(include(tag))
    end

    it "changes the tag with every commit" do
      schema.commit!
      before = table.record_klass.all.to_sql
      schema.revert_to_draft!
      schema.commit!

      expect(table.reload.record_klass.all.to_sql).not_to eq(before)
    end

    it "plans afresh after a recommit changed a column's type" do
      column = Grit::ColumnDefinition.create!(identifier: "some_col", name: "Some", data_type: string_type, table_definition: table)
      schema.commit!
      row = table.record_klass.create!("some_col" => "42")
      expect(table.record_klass.find(row.id)["some_col"]).to eq("42")

      # As another connection, which keeps its statements: Rails' DDL helpers clear this one's.
      allow(connection).to receive(:clear_cache!)
      schema.revert_to_draft!
      column.update!(data_type: create(:grit_core_data_type, :integer))
      schema.commit!

      expect(table.reload.record_klass.find(row.id)["some_col"]).to eq(42)
    end
  end

  describe "constraint naming (T8)" do
    # `<name>_<id in hex, zero-padded to 63 bytes>_<suffix>`.
    def padded(name, id, suffix)
      hex = id.to_s(16)
      "#{name}_#{hex.rjust(63 - name.length - suffix.length - 2, "0")}_#{suffix}"
    end

    it "pads names to PostgreSQL's 63 bytes" do
      expect(Grit::Core::Model::DynamicSchema::TableDefinition.constraint_name("tbl", 26, "pk"))
        .to eq("tbl_#{'0' * 54}1a_pk")
    end

    it "names foreign keys after the column they are on and its definition, or the table for implementation columns" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)

      expect(foreign_key_names(table.table_name))
        .to eq([ padded("c#{column.id}", column.id, "fk"), padded("owner_id", table.id, "fk") ])
    end

    it "names the primary key after the table" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(primary_key_index_name(table.table_name)).to eq(padded("t#{table.id}", table.id, "pk"))
      expect(table.draft_primary_key_name).to eq(padded("t#{table.id}", table.id, "pk"))
    end

    it "keeps draft names through identifier changes" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      names = foreign_key_names(table.table_name)

      column.update!(identifier: "new_col")
      table.update!(identifier: "new_tbl")

      expect(foreign_key_names(table.table_name)).to eq(names)
      expect(primary_key_index_name(table.table_name)).to eq(table.draft_primary_key_name)
    end

    it "renames dynamic column foreign keys and the primary key at commit, and back at revert" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      column = Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
      draft_names = foreign_key_names(table.table_name)

      schema.commit!

      expect(foreign_key_names("test_grp.tbl"))
        .to eq([ padded("owner_id", table.id, "fk"), padded("ref_col", column.id, "fk") ])
      expect(primary_key_index_name("test_grp.tbl")).to eq(padded("tbl", table.id, "pk"))
      expect(table.committed_primary_key_name).to eq(padded("tbl", table.id, "pk"))
      expect(table.record_klass.primary_key).to eq("id")

      schema.revert_to_draft!

      expect(foreign_key_names(table.table_name)).to eq(draft_names)
      expect(primary_key_index_name(table.table_name)).to eq(table.draft_primary_key_name)
    end

    it "leaves a column that is no entity without foreign key through a commit" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "label", name: "Label", data_type: string_type, table_definition: table)

      schema.commit!

      expect(foreign_key_names("test_grp.tbl")).to eq([ padded("owner_id", table.id, "fk") ])
    end

    it "names an implementation column's foreign key the same whatever its target column" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "AlternateTargetTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner_login", data_type_name: "character varying",
              foreign_key: { table_name: "grit_core_users", primary_key: "login" } } ]
        end
      end

      table = klass.create!(identifier: "alt", name: "Alt", schema_definition: schema)

      expect(foreign_key_names(table.table_name)).to eq([ padded("owner_login", table.id, "fk") ])
    end
  end

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

    it "invalidates a record whose implementation column takes a system column name" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "SystemNameImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "xmin", data_type_name: "bigint" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/system column name/)
    end

    it "invalidates a record whose implementation column contains a double underscore" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "AliasImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner__name", data_type_name: "bigint" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/double underscore/)
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

    it "reports a duplicate that also trips another check, in the same pass" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "LongDuplicateImplementationColumnTableDefinition"

        def implementation_column_definitions
          over_long = "o" * (Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH + 1)
          [ { identifier: over_long, data_type_name: "bigint" },
            { identifier: over_long, data_type_name: "bigint" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/at most 30/)
      expect(table.errors[:base].join).to match(/declared more than once/)
    end

    it "reports a duplicate once however often it repeats" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "ThriceImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner_id", data_type_name: "bigint" },
            { identifier: "owner_id", data_type_name: "bigint" },
            { identifier: "owner_id", data_type_name: "bigint" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)
      table.valid?

      expect(table.errors[:base].count { |e| e.match?(/declared more than once/) }).to eq(1)
    end

    # Any bigint id fits beside any identifier, and the padding puts every name past what an
    # identifier can be.
    it "makes every constraint name exactly 63 bytes" do
      max = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
      [ "ab", "c" * max ].product([ 1, 2**63 - 1 ], %w[pk fk]).each do |name, id, suffix|
        constraint_name = Grit::Core::Model::DynamicSchema::TableDefinition.constraint_name(name, id, suffix)
        expect(constraint_name.bytesize).to eq(connection.max_identifier_length)
      end
    end

    it "refuses a constraint name PostgreSQL would truncate" do
      expect { Grit::Core::Model::DynamicSchema::TableDefinition.constraint_name("c" * 50, 2**63 - 1, "fk") }
        .to raise_error(ArgumentError, /over 63 bytes/)
    end

    # The qualified table name is 66 chars: past the combined length Rails checks for, but within
    # what PostgreSQL allows.
    it "commits maximum identifiers at every level whole" do
      max = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
      widest_schema = Grit::SchemaDefinition.create!(identifier: "g" * max, name: "Schema")
      table = Grit::TableDefinition.create!(identifier: "t" * max, name: "Table", schema_definition: widest_schema)
      column = Grit::ColumnDefinition.create!(identifier: "c" * max, name: "Ref", data_type: entity_type, table_definition: table)

      widest_schema.commit!

      expect(table.table_name).to eq("test_#{'g' * max}.#{'t' * max}")
      expect(table.table_name.length).to be > connection.max_identifier_length
      expect(connection.table_exists?(table.table_name)).to be(true)
      expect(connection.columns(table.table_name).map(&:name)).to include("c" * max)
      expect(foreign_key_names(table.table_name))
        .to eq([ table.foreign_key_name("c" * max, column.id), table.foreign_key_name("owner_id") ])
      expect(primary_key_index_name(table.table_name)).to eq(table.committed_primary_key_name)
    end

    # An unmapped SQL type would reach the UI as a property type nothing renders (blank cell, no
    # editor), so it is rejected with the fix in the message.
    it "invalidates an implementation column whose SQL type names no grit type" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "UnmappedTypeImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "blob_col", data_type_name: "jsonb" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/data_type_name "jsonb"/)
      expect(table.errors[:base].join).to match(/declare the grit property type with type:/)
    end

    it "accepts an unmapped SQL type that declares its property type" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "DeclaredTypeImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "blob_col", data_type_name: "jsonb", type: "text" } ]
        end
      end

      typed = klass.create!(identifier: "dcl", name: "Declared", schema_definition: schema)

      expect(committed_klass(typed).column_names).to include("blob_col")
      expect(committed_klass(typed).entity_properties.find { |p| p[:name] == "blob_col" }[:type]).to eq("text")
    end

    it "accepts every spelling the type map knows" do
      Grit::Core::Model::DynamicSchema::TableDefinition::IMPLEMENTATION_COLUMN_TYPES.each_key do |spelling|
        klass = Class.new(Grit::TableDefinition) do
          define_method(:implementation_column_definitions) do
            [ { identifier: "a_column", data_type_name: spelling } ]
          end
        end
        klass.define_singleton_method(:name) { "MappedSpellingTableDefinition" }

        table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)
        table.valid?

        expect(table.errors[:base].join).not_to match(/declare the grit property type/), spelling
      end
    end

    it "invalidates a record whose implementation column has no data_type_name" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "TypelessImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner_id" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/missing a data_type_name/)
    end

    # `entity_fields` and `entity_columns` dereference `entity:`; without it every index request
    # for the table raises.
    it "invalidates an entity column that carries no entity definition" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "EntitylessImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner_id", data_type_name: "bigint", type: "entity" } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/no entity definition/)
    end

    it "invalidates a foreign key with no table_name" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "TargetlessForeignKeyTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner_id", data_type_name: "bigint", foreign_key: { primary_key: "id" } } ]
        end
      end

      table = klass.new(identifier: "tbl", name: "Table", schema_definition: schema)

      expect(table).not_to be_valid
      expect(table.errors[:base].join).to match(/foreign key with no table_name/)
    end

    # An includer overriding `implementation_column_properties` bypasses the validation above, so
    # the expanders guard too.
    it "skips an entity property with no entity hash rather than raising" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      properties = [ { name: "owner_id", display_name: "Owner", type: "entity", entity: nil } ]

      expect {
        expect(committed_klass(table).entity_columns_from_properties(properties).first[:name]).to eq("owner_id")
        expect(committed_klass(table).entity_field_from_property(properties.first)[:name]).to eq("owner_id")
      }.not_to raise_error
    end
  end

  describe "implementation columns in detailed and entity_properties (T12)" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    it "creates the column and its foreign key" do
      expect(committed_klass(table).column_names).to include("owner_id")
      expect(foreign_key_names(table.table_name)).to include(table.foreign_key_name("owner_id"))
    end

    it "selects the column in detailed" do
      expect(committed_klass(table).detailed.to_sql).to include(%(#{table.quoted_table_name}."owner_id"))
    end

    it "returns rows through detailed" do
      committed_klass(table).create!(owner_id: admin.id)
      row = committed_klass(table).detailed.first
      expect(row["owner_id"]).to eq(admin.id)
    end

    it "lists the column in entity_properties" do
      property = committed_klass(table).entity_properties.find { |p| p[:name] == "owner_id" }
      expect(property).to include(display_name: "Owner", type: "integer")
    end

    # The type map inverts `DataType#sql_name`, which rewrites only integer/entity, string and
    # datetime. Other types pass through: mapping "text" to "string" would lose multiline input.
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
      types = committed_klass(typed).entity_properties.to_h { |p| [ p[:name], p[:type] ] }

      expect(types).to include(
        "note_col" => "text",
        "when_col" => "datetime",
        "much_col" => "decimal",
        "name_col" => "string"
      )
    end

    # Hand-written definitions copy types from structure.sql, pg_dump or pg_catalog, which say
    # `numeric` and `bool` rather than `decimal` and `boolean`.
    it "reads the catalog spellings of the same types" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "CatalogSpelledImplementationColumnTableDefinition"

        def implementation_column_definitions
          [ { identifier: "much_col", data_type_name: "numeric" },
            { identifier: "flag_col", data_type_name: "bool" },
            { identifier: "when_col", data_type_name: "timestamp with time zone" },
            { identifier: "tiny_col", data_type_name: "smallint" },
            { identifier: "real_col", data_type_name: "double precision" } ]
        end
      end

      typed = klass.create!(identifier: "cat", name: "Catalog", schema_definition: schema)
      types = committed_klass(typed).entity_properties.to_h { |p| [ p[:name], p[:type] ] }

      expect(types).to include(
        "much_col" => "decimal",
        "flag_col" => "boolean",
        "when_col" => "datetime",
        "tiny_col" => "integer",
        "real_col" => "decimal"
      )
    end

    # Any other type reaches the grid as a blank cell with no editor.
    it "only ever produces a grit property type" do
      produced = Grit::Core::Model::DynamicSchema::TableDefinition::IMPLEMENTATION_COLUMN_TYPES.values.uniq

      expect(produced - Grit::Core::Model::DynamicSchema::TableDefinition::GRIT_PROPERTY_TYPES).to eq([])
    end

    it "lists the column in entity_columns" do
      names = committed_klass(table).entity_columns.map { |c| c[:name] }
      expect(names).to include("owner_id")
    end

    it "keeps the column out of the writable field list" do
      names = committed_klass(table).entity_fields.map { |f| f[:name] }
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
      column = committed_klass(hidden).entity_columns.find { |c| c[:name] == "owner_id" }
      expect(column[:default_hidden]).to be(true)
    end

    # `entity_columns` expands it into `<name>__<display property>` grid columns, so `detailed`
    # must join the target or they stay empty and sorting or filtering on them raises.
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
        sql = committed_klass(owned).detailed.to_sql

        expect(sql).to include(%(LEFT OUTER JOIN "grit_core_users" "owner_id__entities" ON "owner_id__entities"."id" = #{owned.quoted_table_name}."owner_id"))
        expect(sql).to include(%(AS "owner_id__login"))
      end

      it "reads the joined values off a row" do
        committed_klass(owned).create!(owner_id: admin.id)

        row = committed_klass(owned).detailed.first

        expect(row["owner_id"]).to eq(admin.id)
        expect(row["owner_id__login"]).to eq(admin.login)
      end

      it "selects every grid column it advertises" do
        # Each select value's name as readable.rb reads it: its alias, else the column part.
        selected = committed_klass(owned).detailed.select_values.map do |select_value|
          sql = select_value.to_s
          (sql[/\sAS\s+(\S+)\s*\z/i, 1] || sql.split(".").last).to_s.delete('"')
        end
        advertised = committed_klass(owned).entity_columns.map { |c| c[:name] }

        expect(advertised).to include("owner_id__name", "owner_id__login")
        expect(advertised - selected).to be_empty
      end

      it "honours default_hidden on the expanded columns" do
        columns = committed_klass(owned).entity_columns.select { |c| c[:entity]&.dig(:column) == "owner_id" }

        expect(columns).not_to be_empty
        expect(columns.map { |c| c[:default_hidden] }).to all(be(true))
      end
    end

    # `writable:` controls `entity_fields` only; `presented_when:` gates whether the column is
    # described at all.
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
        expect(committed_klass(table).entity_fields.map { |f| f[:name] }).to include("owner_id")
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
        expect(committed_klass(gated).entity_properties.map { |p| p[:name] }).not_to include("owner_id")
        expect(committed_klass(gated).entity_columns.map { |c| c[:name] }).not_to include("owner_id")
        expect(committed_klass(gated).entity_fields.map { |f| f[:name] }).not_to include("owner_id")
      end

      it "describes the column when the keyword is passed" do
        expect(committed_klass(gated).entity_properties(with_owner: true).map { |p| p[:name] }).to include("owner_id")
        expect(committed_klass(gated).entity_columns(with_owner: true).map { |c| c[:name] }).to include("owner_id")
        expect(committed_klass(gated).entity_fields(with_owner: true).map { |f| f[:name] }).to include("owner_id")
      end

      # The gate is presentation only: filtering `implementation_column_definitions` instead
      # would drop the physical column and its foreign key.
      it "still builds the physical column and its foreign key" do
        expect(committed_klass(gated).column_names).to include("owner_id")
        expect(committed_klass(gated).detailed.to_sql).to include(%(#{gated.quoted_table_name}."owner_id"))
        expect(foreign_key_names(gated.table_name)).to include(gated.foreign_key_name("owner_id"))
      end
    end
  end

  describe "an entity implementation column with a non-default target" do
    let(:alt_klass) do
      Class.new(Grit::TableDefinition) do
        def self.name = "AlternateTargetEntityTableDefinition"

        def implementation_column_definitions
          [ { identifier: "owner_login", data_type_name: "character varying", display_name: "Owner",
              type: "entity",
              entity: { full_name: "Grit::Core::User", name: "User", path: "grit/core/users",
                        primary_key: "login", primary_key_type: "string" },
              foreign_key: { table_name: "grit_core_users", primary_key: "login" } } ]
        end
      end
    end

    let(:alt) { alt_klass.create!(identifier: "alt", name: "Alt", schema_definition: schema) }

    # Joining on `id` would compare a bigint to a varchar login: PG::UndefinedFunction, or
    # all-NULL display columns.
    it "joins on the column the foreign key actually points at" do
      sql = committed_klass(alt).detailed.to_sql

      expect(sql).to include(%(LEFT OUTER JOIN "grit_core_users" "owner_login__entities" ON "owner_login__entities"."login" = #{alt.quoted_table_name}."owner_login"))
    end

    it "reads the joined values off a row" do
      committed_klass(alt).create!(owner_login: admin.login)

      row = committed_klass(alt).detailed.first

      expect(row["owner_login"]).to eq(admin.login)
      expect(row["owner_login__login"]).to eq(admin.login)
    end

    it "describes a character varying column as a string" do
      klass = Class.new(Grit::TableDefinition) do
        def self.name = "CharacterVaryingTableDefinition"

        def implementation_column_definitions
          [ { identifier: "a_label", data_type_name: "character varying" } ]
        end
      end

      table = klass.create!(identifier: "lbl", name: "Label", schema_definition: schema)
      property = table.implementation_column_properties.find { |p| p[:name] == "a_label" }

      expect(property[:type]).to eq("string")
    end
  end

  describe "deterministic column order (T13)" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    # Created back to front so that relying on insertion or heap order (what an unordered
    # association returns) fails these tests.
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
      sql = committed_klass(table).detailed.to_sql

      expect(sql.index(%("a_col"))).to be < sql.index(%("b_col"))
    end

    it "orders entity_properties" do
      create_columns_out_of_order
      names = committed_klass(table).entity_properties.map { |property| property[:name] }

      expect(names.index("a_col")).to be < names.index("b_col")
    end

    it "keeps the order across an update to a definition" do
      a, _b = create_columns_out_of_order
      before = committed_klass(table).entity_properties.map { |property| property[:name] }

      # An UPDATE moves the row to a new heap position, reshuffling any unordered read.
      a.update!(name: "Renamed")

      expect(committed_klass(table).entity_properties.map { |property| property[:name] }).to eq(before)
    end

    it "falls back to id when the column definition table has no sort column" do
      # `sort` is a convention an includer may not follow.
      allow(Grit::ColumnDefinition).to receive(:column_names)
        .and_return(Grit::ColumnDefinition.column_names - [ "sort" ])

      sql = table.ordered_column_definitions.to_sql
      expect(sql).not_to include("sort")
      expect(sql).to include(%(ORDER BY "test_column_definitions"."id" ASC))
    end
  end

  describe "entity columns through record_klass" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    let!(:reference) do
      Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table)
    end

    it "joins the target table and selects its display properties" do
      sql = committed_klass(table).detailed.to_sql

      expect(sql).to include(%(LEFT OUTER JOIN "grit_core_users" "ref_col__entities" ON "ref_col__entities"."id" = #{table.quoted_table_name}."ref_col"))
      expect(sql).to include(%(AS "ref_col__name"))
      expect(sql).to include(%(AS "ref_col__login"))
    end

    it "reads the joined values off a row" do
      committed_klass(table).create!(ref_col: admin.id)

      row = committed_klass(table).detailed.first

      expect(row["ref_col"]).to eq(admin.id)
      expect(row["ref_col__login"]).to eq(admin.login)
    end

    it "describes the column as an entity reference" do
      property = committed_klass(table).entity_properties.find { |p| p[:name] == "ref_col" }

      expect(property[:type]).to eq("entity")
      expect(property[:entity]).to include(full_name: "Grit::Core::User", primary_key: "id")
    end

    it "expands the column into one grid column per display property" do
      columns = committed_klass(table).entity_columns.select { |c| c[:entity]&.dig(:column) == "ref_col" }

      expect(columns.map { |c| c[:name] }).to eq(%w[ref_col__name ref_col__login])
      expect(columns.map { |c| c[:display_name] }).to eq([ "Ref Name", "Ref Login" ])
    end

    it "keeps the column writable, under its own name" do
      field = committed_klass(table).entity_fields.find { |f| f[:name] == "ref_col" }

      expect(field).not_to be_nil
      expect(field[:entity]).to include(column: "ref_col", display_column: "name")
    end
  end

  describe "drop_table" do
    it "drops the table when the definition is destroyed" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      table_name = table.table_name

      table.destroy!

      expect(connection.table_exists?(table_name)).to be(false)
    end

    it "drops every table in the schema when the schema is destroyed" do
      one = Grit::TableDefinition.create!(identifier: "one", name: "One", schema_definition: schema)
      two = Grit::TableDefinition.create!(identifier: "two", name: "Two", schema_definition: schema)
      table_names = [ one.table_name, two.table_name ]

      schema.destroy!

      table_names.each { |table_name| expect(connection.table_exists?(table_name)).to be(false) }
    end

    # The table is named after the id, which no refused change can touch.
    it "drops its own table, whatever a refused change left in memory" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      other = Grit::TableDefinition.create!(identifier: "other", name: "Other", schema_definition: schema)
      table_name = table.table_name

      expect(table.update(identifier: "other")).to be(false)
      table.destroy!

      expect(connection.table_exists?(table_name)).to be(false)
      expect(connection.table_exists?(other.table_name)).to be(true)
    end

    it "drops its own table after a refused move to another schema" do
      other_schema = Grit::SchemaDefinition.create!(identifier: "other", name: "Other")
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      table_name = table.table_name

      expect(table.update(schema_definition: other_schema)).to be(false)
      table.destroy!

      expect(connection.table_exists?(table_name)).to be(false)
    end

    # The guard must check the table's current schema, not the one it was refused a move to.
    it "stays in a committed schema after a refused move to a draft one" do
      other_schema = Grit::SchemaDefinition.create!(identifier: "other", name: "Other")
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      schema.commit!

      expect(table.update(schema_definition: other_schema)).to be(false)

      expect(table.destroy).to be(false)
      expect(connection.table_exists?("test_grp.tbl")).to be(true)
    end

    # Destroy callbacks run on a record that was never saved.
    it "drops nothing when destroyed before it was saved" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)

      Grit::TableDefinition.new(identifier: "tbl", name: "Clash", schema_definition: schema).destroy

      expect(connection.table_exists?(table.table_name)).to be(true)
    end

    # Uses `dependent: :delete_all`: `:destroy` would run each column's `drop_column` just
    # before the DROP TABLE.
    it "drops no columns on its way to dropping the table" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      Grit::ColumnDefinition.create!(identifier: "one_col", name: "One", data_type: string_type, table_definition: table)
      Grit::ColumnDefinition.create!(identifier: "two_col", name: "Two", data_type: string_type, table_definition: table)
      table_name = table.table_name

      statements = []
      subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*, payload|
        statements << payload[:sql]
      end
      begin
        table.destroy!
      ensure
        ActiveSupport::Notifications.unsubscribe(subscriber)
      end

      expect(statements.grep(/ALTER TABLE .* DROP COLUMN/i)).to be_empty
      expect(connection.table_exists?(table_name)).to be(false)
      expect(Grit::ColumnDefinition.where(table_definition_id: table.id)).to be_empty
    end

    it "still drops a column when only its definition is destroyed" do
      table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
      definition = Grit::ColumnDefinition.create!(identifier: "one_col", name: "One", data_type: string_type, table_definition: table)

      definition.destroy!

      expect(connection.columns(table.table_name).map(&:name)).not_to include("c#{definition.id}")
      expect(connection.table_exists?(table.table_name)).to be(true)
    end
  end

  describe "column names Rails reads as its own" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }

    it "stores and reads back a value in a column named type" do
      Grit::ColumnDefinition.create!(identifier: "type", name: "Type", data_type: string_type, table_definition: table)

      committed_klass(table).create!(type: "x")

      expect(committed_klass(table).detailed.first["type"]).to eq("x")
      expect(committed_klass(table).first["type"]).to eq("x")
    end

    it "does not lock optimistically on a column named lock_version" do
      Grit::ColumnDefinition.create!(identifier: "lock_version", name: "Lock version", data_type: integer_type, table_definition: table)

      row = committed_klass(table).create!(lock_version: 5)
      stale = committed_klass(table).find(row.id)
      row.update!(owner_id: admin.id)

      expect(row.reload["lock_version"]).to eq(5)
      expect { stale.update!(owner_id: nil) }.not_to raise_error
    end

    it "does not stamp columns named created_on or updated_on" do
      Grit::ColumnDefinition.create!(identifier: "created_on", name: "Created on", data_type: string_type, table_definition: table)
      Grit::ColumnDefinition.create!(identifier: "updated_on", name: "Updated on", data_type: string_type, table_definition: table)

      row = committed_klass(table).create!(updated_on: "x")
      row.update!(owner_id: admin.id)

      expect(row.reload["created_on"]).to be_nil
      expect(row["updated_on"]).to eq("x")
    end
  end

  describe "record_klass stamping" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    it "stamps the current user on create" do
      row = committed_klass(table).create!

      expect(row["created_by"]).to eq(admin.login)
      expect(row["updated_by"]).to eq(admin.login)
    end

    it "leaves created_by alone on update" do
      row = committed_klass(table).create!
      other = create(:grit_core_user, :with_administrator_role)
      set_current_user(other)

      row.update!(owner_id: admin.id)

      expect(row["created_by"]).to eq(admin.login)
      expect(row["updated_by"]).to eq(other.login)
    end
  end

  # ==========================================================================
  # Columns are attributes, never methods
  # ==========================================================================

  describe "record_klass attribute access" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    it "defines no method for a column" do
      klass = committed_klass(table)
      row = klass.create!(owner_id: admin.id)

      expect(klass.method_defined?(:owner_id)).to be(false)
      expect(klass.method_defined?(:owner_id=)).to be(false)
      expect(klass.method_defined?(:owner_id_changed?)).to be(false)
      expect(row).not_to respond_to(:owner_id)
      expect { row.owner_id }.to raise_error(NoMethodError)
      expect(row["owner_id"]).to eq(admin.id)
    end

    it "keeps the methods Rails defines for id" do
      row = committed_klass(table).create!

      expect(row.id).to be_present
      expect(row.id_previously_changed?).to be(true)
    end

    it "assigns a column from the scope it is created through" do
      row = committed_klass(table).where(owner_id: admin.id).create!

      expect(row.reload["owner_id"]).to eq(admin.id)
    end

    it "still refuses unpermitted parameters" do
      params = ActionController::Parameters.new(owner_id: admin.id)

      expect { committed_klass(table).new(params) }.to raise_error(ActiveModel::ForbiddenAttributesError)
      expect(committed_klass(table).new(params.permit(:owner_id))["owner_id"]).to eq(admin.id)
    end

    it "still refuses an attribute the table does not have" do
      expect { committed_klass(table).new(not_a_column: 1) }.to raise_error(ActiveModel::UnknownAttributeError)
    end
  end

  # ==========================================================================
  # Committed dynamic columns are physically named after their identifiers
  # ==========================================================================

  describe "dynamic columns by identifier" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }
    let!(:label) { Grit::ColumnDefinition.create!(identifier: "label", name: "Label", data_type: string_type, table_definition: table) }
    let!(:reference) { Grit::ColumnDefinition.create!(identifier: "ref_col", name: "Ref", data_type: entity_type, table_definition: table) }

    # Mirrors readable.rb's `select_values_map`: filter/sort name => SQL expression.
    def select_values_map(scope)
      scope.select_values.each_with_object({}) do |select_value, memo|
        sql = select_value.to_s
        aliased = /\A(?<expression>.+)\s+AS\s+(?<alias>.+)\z/i.match(sql)
        if aliased
          memo[aliased[:alias].delete('"')] = aliased[:expression]
        else
          memo[sql.split(".").last.delete('"')] = sql
        end
      end
    end

    shared_examples "columns reached by identifier" do
      it "writes and reads them" do
        row = committed_klass(table).create!(label: "first", ref_col: admin.id)

        expect(row["label"]).to eq("first")
        expect(committed_klass(table).find(row.id)["label"]).to eq("first")
        expect(committed_klass(table).find(row.id)["ref_col"]).to eq(admin.id)
      end

      it "updates them" do
        row = committed_klass(table).create!(label: "first")

        row.update!(label: "second")

        expect(committed_klass(table).find(row.id)["label"]).to eq("second")
      end

      it "queries them" do
        committed_klass(table).create!(label: "b")
        committed_klass(table).create!(label: "a")

        expect(committed_klass(table).where(label: "a").count).to eq(1)
        expect(committed_klass(table).find_by(label: "b")).to be_present
        expect(committed_klass(table).order(:label).pluck(:label)).to eq(%w[a b])
      end

      it "serialises them under their identifiers" do
        row = committed_klass(table).create!(label: "first", ref_col: admin.id)

        expect(committed_klass(table).find(row.id).as_json).to include("label" => "first", "ref_col" => admin.id)
        expect(committed_klass(table).detailed.find(row.id).as_json)
          .to include("label" => "first", "ref_col" => admin.id, "ref_col__login" => admin.login)
      end

      it "reads them off a row loaded through detailed" do
        committed_klass(table).create!(label: "first")

        row = committed_klass(table).detailed.first

        expect(row["label"]).to eq("first")
        expect(row.has_attribute?("label")).to be(true)
      end

      it "lets readable filter and sort detailed by them" do
        committed_klass(table).create!(label: "b", ref_col: admin.id)
        committed_klass(table).create!(label: "a")
        scope = committed_klass(table).detailed
        columns = select_values_map(scope)

        expect(columns.keys).to include("label", "ref_col", "ref_col__login")
        expect(scope.order(Arel.sql("#{columns['label']} DESC")).map { |row| row["label"] }).to eq(%w[b a])
        expect(scope.where("#{columns['ref_col__login']} = ?", admin.login).map { |row| row["label"] }).to eq(%w[b])
      end

      it "describes them by identifier" do
        names = committed_klass(table).entity_properties.map { |property| property[:name] }

        expect(names).to include("label", "ref_col")
      end
    end

    context "once committed" do
      before(:each) { schema.commit! }

      it "reaches them through columns named after them" do
        expect(committed_klass(table).column_names).to include("label", "ref_col")
      end

      include_examples "columns reached by identifier"
    end
  end

  # ==========================================================================
  # Implementation column changes ship with a migration using these helpers
  # ==========================================================================

  describe "implementation column migration helpers" do
    let(:owner_column) { { identifier: "owner_id", data_type_name: "bigint", foreign_key: { table_name: "grit_core_users" } } }
    let(:batch_column) { { identifier: "batch_id", data_type_name: "bigint", foreign_key: { table_name: "grit_core_users" } } }
    let(:other_schema) { Grit::SchemaDefinition.create!(identifier: "other", name: "Other") }

    # Stands in for the code change the migration ships with.
    def declare(*columns)
      allow_any_instance_of(Grit::TableDefinition).to receive(:implementation_column_definitions).and_return(columns)
    end

    def column_named(table_name, name)
      connection.columns(table_name).find { |column| column.name == name }
    end

    describe "each_physical_table" do
      it "yields every table under the name its schema's state gives it" do
        draft = Grit::TableDefinition.create!(identifier: "drf", name: "Draft", schema_definition: schema)
        committed = Grit::TableDefinition.create!(identifier: "cmt", name: "Committed", schema_definition: other_schema)
        other_schema.commit!

        seen = {}
        Grit::TableDefinition.each_physical_table { |table, table_name| seen[table.id] = table_name }

        expect(seen).to eq(draft.id => "test_#{schema.id}.t#{draft.id}", committed.id => "test_other.cmt")
      end

      it "raises for a table that is not there" do
        table = Grit::TableDefinition.create!(identifier: "gone", name: "Gone", schema_definition: schema)
        connection.drop_table table.table_name

        expect { Grit::TableDefinition.each_physical_table { } }.to raise_error(/does not exist/)
      end
    end

    describe "add_implementation_column" do
      let!(:draft) { Grit::TableDefinition.create!(identifier: "drf", name: "Draft", schema_definition: schema) }
      let!(:committed) { Grit::TableDefinition.create!(identifier: "cmt", name: "Committed", schema_definition: other_schema) }
      let(:table_names) { [ draft.table_name, "test_other.cmt" ] }

      before(:each) { other_schema.commit! }

      it "adds the column and its foreign key to draft and committed tables" do
        declare(owner_column, batch_column)

        Grit::TableDefinition.add_implementation_column(:batch_id)

        [ draft, committed ].zip(table_names).each do |table, table_name|
          expect(column_named(table_name, "batch_id").null).to be(true)
          expect(foreign_key_names(table_name)).to include(table.foreign_key_name("batch_id"))
        end
      end

      it "points the foreign key at the declared target column" do
        declare(owner_column, { identifier: "owner_login", data_type_name: "character varying",
                                foreign_key: { table_name: "grit_core_users", primary_key: "login" } })

        Grit::TableDefinition.add_implementation_column(:owner_login)

        expect(foreign_key_names("test_other.cmt")).to include(committed.foreign_key_name("owner_login"))
      end

      it "hands each table to the block to fill a required column in" do
        insert_draft_row(draft)
        committed.record_klass.create!
        declare(owner_column, batch_column.merge(required: true))

        Grit::TableDefinition.add_implementation_column(:batch_id) do |_table, table_name|
          connection.execute("UPDATE #{connection.quote_table_name(table_name)} SET batch_id = #{admin.id}")
        end

        table_names.each { |table_name| expect(column_named(table_name, "batch_id").null).to be(false) }
      end

      it "refuses to require a column the block left empty" do
        committed.record_klass.create!
        declare(owner_column, batch_column.merge(required: true))

        expect { Grit::TableDefinition.add_implementation_column(:batch_id) }
          .to raise_error(/Cannot require batch_id on test_other\.cmt: some rows have no value/)
      end

      it "can be run again" do
        declare(owner_column, batch_column)
        Grit::TableDefinition.add_implementation_column(:batch_id)

        expect { Grit::TableDefinition.add_implementation_column(:batch_id) }.not_to raise_error
        expect(foreign_key_names("test_other.cmt"))
          .to eq([ committed.foreign_key_name("batch_id"), committed.foreign_key_name("owner_id") ])
      end

      it "refuses a column a column definition is already identified by" do
        declare(owner_column, batch_column)
        Grit::ColumnDefinition.new(identifier: "batch_id", name: "Batch", data_type: string_type, table_definition: draft).save!(validate: false)

        expect { Grit::TableDefinition.add_implementation_column(:batch_id) }
          .to raise_error(ArgumentError, /a column definition is already identified batch_id/)
        expect(column_named(draft.table_name, "batch_id")).to be_nil
      end

      it "refuses to take a table past MAX_COLUMNS" do
        stub_const("Grit::Core::Model::DynamicSchema::TableDefinition::MAX_COLUMNS", 6)
        declare(owner_column, batch_column)

        expect { Grit::TableDefinition.add_implementation_column(:batch_id) }
          .to raise_error(ArgumentError, /would have more than 6 columns/)
      end

      it "refuses a column no table declares" do
        expect { Grit::TableDefinition.add_implementation_column(:batch_id) }
          .to raise_error(ArgumentError, /No Grit::TableDefinition declares the implementation column "batch_id"/)
      end
    end

    it "has nothing to add when there are no tables" do
      expect { Grit::TableDefinition.add_implementation_column(:batch_id) }.not_to raise_error
    end

    describe "remove_implementation_column" do
      it "drops the column and its foreign key from draft and committed tables" do
        draft = Grit::TableDefinition.create!(identifier: "drf", name: "Draft", schema_definition: schema)
        Grit::TableDefinition.create!(identifier: "cmt", name: "Committed", schema_definition: other_schema)
        other_schema.commit!
        declare

        Grit::TableDefinition.remove_implementation_column(:owner_id)

        [ draft.table_name, "test_other.cmt" ].each do |table_name|
          expect(column_named(table_name, "owner_id")).to be_nil
          expect(foreign_key_names(table_name)).to be_empty
        end
      end

      it "refuses while the column is still declared" do
        Grit::TableDefinition.create!(identifier: "drf", name: "Draft", schema_definition: schema)

        expect { Grit::TableDefinition.remove_implementation_column(:owner_id) }
          .to raise_error(ArgumentError, /still declares the implementation column owner_id/)
      end

      # A committed column definition's column is named after its identifier and holds user data.
      it "leaves a committed column definition's column alone" do
        declare
        table = Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema)
        Grit::ColumnDefinition.create!(identifier: "owner_id", name: "Owner", data_type: string_type, table_definition: table)
        schema.commit!

        Grit::TableDefinition.remove_implementation_column(:owner_id)

        expect(column_named("test_grp.tbl", "owner_id")).not_to be_nil
      end
    end
  end

  describe "association helpers" do
    it "names the foreign key column after the association" do
      expect(Grit::TableDefinition.schema_definition_id).to eq(:schema_definition_id)
    end
  end
end
