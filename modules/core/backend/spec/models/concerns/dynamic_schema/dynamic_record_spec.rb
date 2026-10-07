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

# The class `TableDefinition#record_klass` returns, exercised through the
# Grit::TableDefinition dummy model against real DDL; PostgreSQL's transactional
# DDL plus `use_transactional_fixtures` rolls it back per example. The
# definition side is in table_definition_spec.
RSpec.describe Grit::Core::Model::DynamicSchema::DynamicRecord, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:schema) { Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema") }
  let(:string_type) { create(:grit_core_data_type, :string) }

  before(:each) do
    set_current_user(admin)
  end

  def connection
    ActiveRecord::Base.connection
  end

  describe ".for" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    it "returns a subclass that is its own base class" do
      klass = committed_klass(table)

      expect(klass).to be < described_class
      expect(klass.base_class).to equal(klass)
    end

    it "exposes the definition it was built from" do
      Grit::ColumnDefinition.create!(identifier: "label", name: "Label", data_type: string_type, table_definition: table)
      Grit::ColumnDefinition.create!(identifier: "other", name: "Other", data_type: string_type, table_definition: table)
      klass = committed_klass(table)

      expect(klass.table_definition).to equal(table)
      expect(klass.column_definitions.map(&:identifier)).to eq(%w[label other])
    end

    it "builds a new class on every call" do
      committed_klass(table)

      expect(table.record_klass).not_to equal(table.record_klass)
    end
  end

  it "is not a grit entity" do
    expect(Grit::Core::EntityMapper.grit_entity_classes).not_to include(described_class)
  end

  # Prepared statements are keyed by their SQL, on every connection. Untagged, a statement
  # prepared before a revert is reused after a recommit that changed the columns, which
  # PostgreSQL refuses ("cached plan must not change result type"), for good inside a
  # transaction.
  describe "query generations" do
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

  describe "stamping" do
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

  describe "naming" do
    let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }

    it "names the class after its table" do
      klass = committed_klass(table)

      expect(klass.name).to eq("DynamicRecord(test_grp.tbl)")
      expect(klass.model_name.name).to eq("DynamicRecord(test_grp.tbl)")
    end

    it "builds the full message of an attribute error" do
      Grit::ColumnDefinition.create!(identifier: "label", name: "Label", data_type: string_type, table_definition: table)
      row = committed_klass(table).new

      row.errors.add("label", :blank)

      expect(row.errors.full_messages).to eq([ "Label can't be blank" ])
    end

    it "keys the cache by table" do
      other = Grit::TableDefinition.create!(identifier: "other", name: "Other", schema_definition: schema)
      row = committed_klass(table).create!(id: 1)
      other_row = other.record_klass.create!(id: 1)

      expect(row.cache_key).not_to eq(other_row.cache_key)
    end

    it "versions the cache by updated_at" do
      row = committed_klass(table).create!

      expect(row.cache_version).to eq(row["updated_at"].utc.to_fs(:usec))
      expect(row.cache_key_with_version).to eq("#{row.cache_key}-#{row.cache_version}")
      expect(committed_klass(table).find(row.id).cache_version).to eq(row.cache_version)
    end
  end

  # ==========================================================================
  # Columns are attributes, never methods
  # ==========================================================================

  describe "attribute access" do
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
end
