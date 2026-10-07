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

# One copy of the identifier rules for the schema, table and column definition concerns,
# so exercised through all three dummy models.
RSpec.describe "DynamicSchema::ValidIdentifier concern", type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:schema) { Grit::SchemaDefinition.create!(identifier: "grp", name: "Schema") }
  let(:table) { Grit::TableDefinition.create!(identifier: "tbl", name: "Table", schema_definition: schema) }
  let(:string_type) { create(:grit_core_data_type, :string) }

  before(:each) do
    set_current_user(admin)
  end

  def build_with_identifier(model, identifier)
    case model
    when :schema then Grit::SchemaDefinition.new(identifier: identifier, name: "X")
    when :table then Grit::TableDefinition.new(identifier: identifier, name: "X", schema_definition: schema)
    when :column then Grit::ColumnDefinition.new(identifier: identifier, name: "X", data_type: string_type, table_definition: table)
    end
  end

  describe "shared validations" do
    %i[schema table column].each do |model|
      context "on #{model} definitions" do
        it "requires an identifier" do
          record = build_with_identifier(model, nil)
          expect(record).not_to be_valid
          expect(record.errors[:identifier]).to include("can't be blank")
        end

        it "rejects an identifier shorter than two characters" do
          record = build_with_identifier(model, "a")
          expect(record).not_to be_valid
          expect(record.errors[:identifier].join).to match(/too short/)
        end

        it "rejects an identifier longer than thirty characters" do
          record = build_with_identifier(model, "a" * (Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH + 1))
          expect(record).not_to be_valid
          expect(record.errors[:identifier].join).to match(/too long/)
        end

        it "accepts an identifier at the limit" do
          record = build_with_identifier(model, "a" * Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH)
          expect(record).to be_valid
        end

        it "rejects an identifier that does not start with two lowercase letters" do
          record = build_with_identifier(model, "1abc")
          expect(record).not_to be_valid
          expect(record.errors[:identifier]).to include("should start with two lowercase letters or underscores")
        end

        it "rejects an identifier carrying anything but lowercase letters, numbers and underscores" do
          record = build_with_identifier(model, "ab_cd1")
          expect(record).to be_valid

          record = build_with_identifier(model, "abCd")
          expect(record).not_to be_valid
          expect(record.errors[:identifier]).to include("should contain only lowercase letters, numbers and underscores")
        end

        it "reports one message, not two, for one bad character" do
          record = build_with_identifier(model, "ab-cd")
          expect(record).not_to be_valid
          expect(record.errors[:identifier]).to eq([ "should contain only lowercase letters, numbers and underscores" ])
        end
      end
    end
  end

  describe "reserved identifiers" do
    it "defaults to the columns every dynamic table has" do
      expect(Grit::ColumnDefinition.reserved_identifiers)
        .to eq(%w[id created_at created_by updated_at updated_by])
    end

    %w[id created_at created_by updated_at updated_by].each do |reserved|
      it "rejects #{reserved.inspect}" do
        record = build_with_identifier(:column, reserved)
        expect(record).not_to be_valid
        expect(record.errors[:identifier]).to include("is a reserved keyword and cannot be used as identifier")
      end
    end

    # Method names are allowed: schema and table identifiers only name PostgreSQL objects,
    # and `record_klass` defines no method per column.
    %w[display hash save].each do |method_name|
      it "lets a schema take #{method_name.inspect}, which names no PostgreSQL object" do
        expect(build_with_identifier(:schema, method_name)).to be_valid
      end

      it "lets a table take #{method_name.inspect}" do
        expect(build_with_identifier(:table, method_name)).to be_valid
      end
    end

    # SQL keywords are allowed on purpose: `group` is a natural column name, and
    # everything that emits SQL quotes identifiers.
    %i[schema table column].each do |model|
      it "lets a #{model} take SQL keywords" do
        %w[group order user select table].each do |keyword|
          expect(build_with_identifier(model, keyword)).to be_valid
        end
      end
    end

    it "no longer reserves the assays-specific experiment_id" do
      expect(build_with_identifier(:column, "experiment_id")).to be_valid
    end

    # `reserved_identifiers` is static, so the table's own implementation columns are
    # checked separately.
    it "rejects an identifier the table already uses for an implementation column" do
      record = build_with_identifier(:column, "owner_id")

      expect(record).not_to be_valid
      expect(record.errors[:identifier]).to include("is reserved by this table and cannot be used as identifier")
    end

    it "lets an includer add its own without disturbing its siblings" do
      klass = Class.new(Grit::ColumnDefinition) do
        def self.name = "ReservingColumnDefinition"
        self.reserved_identifiers += %w[experiment_id]
      end

      reserving = klass.new(identifier: "experiment_id", name: "X", data_type: string_type, table_definition: table)
      expect(reserving).not_to be_valid
      expect(reserving.errors[:identifier]).to include("is a reserved keyword and cannot be used as identifier")

      # `+=` replaces the frozen default rather than mutating it, so no other class sees it.
      expect(Grit::ColumnDefinition.reserved_identifiers).not_to include("experiment_id")
      expect(Grit::TableDefinition.reserved_identifiers).not_to include("experiment_id")
      expect(Grit::SchemaDefinition.reserved_identifiers).not_to include("experiment_id")
      expect(build_with_identifier(:column, "experiment_id")).to be_valid
    end
  end
end
