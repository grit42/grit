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
require "ostruct"

RSpec.describe Grit::Core::EntityLoader, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:origin) { create(:grit_core_origin) }

  before(:each) do
    Grit::Core::UserSession.create(admin)
  end

  # =========================================================================
  # Loader Dispatch
  # =========================================================================

  describe ".loader" do
    it "resolves a specialized loader class by entity name" do
      expect(described_class.loader("TestEntity")).to eq(TestEntityLoader)
    end

    it "falls back to EntityLoader when no specialized loader exists" do
      expect(described_class.loader("Grit::Core::Origin")).to eq(described_class)
    end
  end

  # =========================================================================
  # fields / block_fields
  # =========================================================================

  describe ".fields" do
    it "returns entity field with disabled flag" do
      fields = described_class.send(:fields, {})
      entity_field = fields.find { |f| f[:name] == "entity" }
      expect(entity_field).not_to be_nil
      expect(entity_field[:disabled]).to be_truthy
    end
  end

  describe ".block_fields" do
    it "excludes data field and marks separator required with placeholder" do
      fields = described_class.send(:block_fields, {})
      expect(fields.find { |f| f[:name] == "data" }).to be_nil
      separator_field = fields.find { |f| f[:name] == "separator" }
      expect(separator_field).not_to be_nil
      expect(separator_field[:required]).to be_truthy
      expect(separator_field[:placeholder]).not_to be_nil
    end
  end

  # =========================================================================
  # validate_record_properties — mapping resolution
  # =========================================================================

  describe ".validate_record_properties (mapping resolution)" do
    it "skips property with no mapping entry" do
      properties = [ { name: "name", type: "string" } ]
      lsb = OpenStruct.new(mappings: {})
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, {}, record, record_props, unique_properties)

      expect(record_props).not_to have_key("name")
      expect(record[:record_errors]).to be_nil
    end

    it "resolves constant mapping" do
      properties = [ { name: "name", type: "string" } ]
      lsb = OpenStruct.new(mappings: { "name" => { "constant" => true, "value" => "fixed_value" } })
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, {}, record, record_props, unique_properties)

      expect(record_props["name"]).to eq("fixed_value")
      expect(record[:record_errors]).to be_nil
    end

    it "resolves header mapping from datum" do
      properties = [ { name: "name", type: "string" } ]
      lsb = OpenStruct.new(mappings: { "name" => { "header" => "col_0" } })
      datum = { "col_0" => "hello" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record_props["name"]).to eq("hello")
      expect(record[:record_errors]).to be_nil
    end

    it "resolves find_by entity lookup to record id" do
      properties = [ {
        name: "origin_id",
        type: "integer",
        entity: { full_name: "Grit::Core::Origin", name: "Origin", options: nil }
      } ]
      lsb = OpenStruct.new(mappings: { "origin_id" => { "find_by" => "name", "header" => "col_0" } })
      datum = { "col_0" => origin.name }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record_props["origin_id"]).to eq(origin.id)
      expect(record[:record_errors]).to be_nil
    end

    it "sets error for unknown entity model" do
      properties = [ {
        name: "thing_id",
        type: "integer",
        entity: { full_name: "Nonexistent::Model", name: "Nonexistent", options: nil }
      } ]
      lsb = OpenStruct.new(mappings: { "thing_id" => { "find_by" => "name", "header" => "col_0" } })
      datum = { "col_0" => "some_value" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]["thing_id"].first).to include("No such model")
      expect(record_props["thing_id"]).to eq(0)
    end

    it "sets error when entity record not found" do
      properties = [ {
        name: "origin_id",
        type: "integer",
        entity: { full_name: "Grit::Core::Origin", name: "Origin", options: nil }
      } ]
      lsb = OpenStruct.new(mappings: { "origin_id" => { "find_by" => "name", "header" => "col_0" } })
      datum = { "col_0" => "does_not_exist" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]["origin_id"].first).to include("could not find")
      expect(record_props["origin_id"]).to eq(0)
    end
  end

  # =========================================================================
  # validate_record_properties — type validation
  # =========================================================================

  describe ".validate_record_properties (type validation)" do
    it "required string with blank value sets can't be blank error" do
      properties = [ { name: "name", type: "string", required: true } ]
      lsb = OpenStruct.new(mappings: { "name" => { "header" => "col_0" } })
      datum = { "col_0" => "" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]["name"]).to include("can't be blank")
    end

    it "required string with present value produces no error" do
      properties = [ { name: "name", type: "string", required: true } ]
      lsb = OpenStruct.new(mappings: { "name" => { "header" => "col_0" } })
      datum = { "col_0" => "hello" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).to be_nil
    end

    it "decimal with valid value produces no error" do
      properties = [ { name: "amount", type: "decimal" } ]
      lsb = OpenStruct.new(mappings: { "amount" => { "header" => "col_0" } })
      datum = { "col_0" => "3.14" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).to be_nil
      expect(record_props["amount"]).to eq("3.14")
    end

    it "decimal with invalid string sets is not a number error" do
      properties = [ { name: "amount", type: "decimal" } ]
      lsb = OpenStruct.new(mappings: { "amount" => { "header" => "col_0" } })
      datum = { "col_0" => "not-a-number" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]["amount"]).to include("is not a number")
    end

    it "integer with valid value produces no error" do
      properties = [ { name: "count", type: "integer" } ]
      lsb = OpenStruct.new(mappings: { "count" => { "header" => "col_0" } })
      datum = { "col_0" => "42" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).to be_nil
      expect(record_props["count"]).to eq("42")
    end

    it "integer with non-numeric string sets is not a integer error" do
      properties = [ { name: "count", type: "integer" } ]
      lsb = OpenStruct.new(mappings: { "count" => { "header" => "col_0" } })
      datum = { "col_0" => "abc" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]["count"]).to include("is not a integer")
    end

    it "integer out of range sets is out of range error" do
      properties = [ { name: "count", type: "integer" } ]
      lsb = OpenStruct.new(mappings: { "count" => { "header" => "col_0" } })
      datum = { "col_0" => (2**53).to_s }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]["count"]).to include("is out of range")
    end

    it "datetime with valid ISO string parses to DateTime" do
      properties = [ { name: "occurred_at", type: "datetime" } ]
      lsb = OpenStruct.new(mappings: { "occurred_at" => { "header" => "col_0" } })
      datum = { "col_0" => "2025-01-15T10:30:00Z" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).to be_nil
      expect(record_props["occurred_at"]).to be_a(DateTime)
    end

    it "datetime with invalid string sets Unable to parse datetime error" do
      properties = [ { name: "occurred_at", type: "datetime" } ]
      lsb = OpenStruct.new(mappings: { "occurred_at" => { "header" => "col_0" } })
      datum = { "col_0" => "not-a-date" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]["occurred_at"].first).to include("Unable to parse datetime")
    end

    it "date with valid string parses to Date" do
      properties = [ { name: "date_field", type: "date" } ]
      lsb = OpenStruct.new(mappings: { "date_field" => { "header" => "col_0" } })
      datum = { "col_0" => "2025-01-15" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).to be_nil
      expect(record_props["date_field"]).to be_a(Date)
    end

    it "date with invalid string sets Unable to parse date error" do
      properties = [ { name: "date_field", type: "date" } ]
      lsb = OpenStruct.new(mappings: { "date_field" => { "header" => "col_0" } })
      datum = { "col_0" => "not-a-date" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]["date_field"].first).to include("Unable to parse date")
    end
  end

  # =========================================================================
  # validate_record_properties — uniqueness
  # =========================================================================

  describe ".validate_record_properties (uniqueness)" do
    it "first occurrence adds no error and tracks value" do
      properties = [ { name: "code", type: "string", unique: true } ]
      lsb = OpenStruct.new(mappings: { "code" => { "header" => "col_0" } })
      datum = { "col_0" => "ABC" }
      record = {}
      record_props = {}
      unique_properties = Hash.new { |h, k| h[k] = Set.new }

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).to be_nil
      expect(unique_properties["code"]).to include("ABC")
    end

    it "duplicate sets should be unique error" do
      properties = [ { name: "code", type: "string", unique: true } ]
      lsb = OpenStruct.new(mappings: { "code" => { "header" => "col_0" } })
      unique_properties = Hash.new { |h, k| h[k] = Set.new }
      unique_properties["code"].add("ABC")

      datum = { "col_0" => "ABC" }
      record = {}
      record_props = {}

      described_class.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]["code"].first).to include("should be unique")
    end
  end

  # =========================================================================
  # mapping_fields / block_mapping_fields
  # =========================================================================

  describe ".mapping_fields" do
    it "returns entity fields for the load set entity" do
      load_set = create(:grit_core_load_set, entity: "TestEntity")
      fields = described_class.send(:mapping_fields, load_set)
      expect(fields).to be_a(Array)
      expect(fields.any? { |f| f[:name] == "name" }).to be_truthy
    end
  end

  describe ".block_mapping_fields" do
    it "returns entity fields via the load set block" do
      load_set = create(:grit_core_load_set, entity: "TestEntity")
      load_set_block = create(:grit_core_load_set_block, :mapping, load_set: load_set)
      fields = described_class.send(:block_mapping_fields, load_set_block)
      expect(fields).to be_a(Array)
      expect(fields.any? { |f| f[:name] == "name" }).to be_truthy
    end
  end
end
