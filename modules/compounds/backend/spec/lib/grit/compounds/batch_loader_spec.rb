# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/compounds.
#
# @grit42/compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

RSpec.describe Grit::Compounds::BatchLoader do
  let(:origin) { create(:grit_core_origin) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:compound) { create(:grit_compounds_compound, origin: origin, compound_type: compound_type) }

  before do
    admin = create(:grit_core_user, :admin, :with_admin_role)
    set_current_user(admin)
  end

  describe ".block_fields" do
    it "returns block fields including batch-specific fields" do
      params = { entity: "Grit::Compounds::Batch" }
      fields = described_class.block_fields(params)

      field_names = fields.map { |f| f[:name] }
      expect(field_names).to include("name")
      expect(field_names).to include("separator")
      expect(field_names).to include("compound_type_id")
    end
  end

  describe ".block_set_data_fields" do
    it "returns block set data fields" do
      params = { entity: "Grit::Compounds::Batch" }
      fields = described_class.block_set_data_fields(params)

      expect(fields).to be_an(Array)
    end
  end

  describe "entity_fields" do
    it "returns mapping fields for batch type" do
      mapping_fields = Grit::Compounds::Batch.entity_fields(compound_type_id: compound_type.id)
      field_names = mapping_fields.map { |f| f[:name] }

      expect(field_names).to include("name")
      expect(field_names).to include("compound_id")
    end

    it "returns loading fields for batch type" do
      loading_fields = Grit::Compounds::Batch.entity_fields(compound_type_id: compound_type.id)
      field_names = loading_fields.map { |f| f[:name] }

      expect(field_names).to include("name")
      expect(field_names).to include("compound_id")
    end
  end

  describe ".validate_record (private)" do
    it "validates batch property values" do
      string_property = create(:grit_compounds_batch_property, :string_type, compound_type: compound_type)

      context = {
        batch_properties: [ string_property ],
        db_property_names: Grit::Compounds::Batch.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "test_batch",
        "compound_id" => compound.id,
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id,
        string_property.safe_name => "valid_string_value"
      }

      described_class.send(:validate_record, Grit::Compounds::Batch, record, record_props, context)

      expect(record[:record_errors]).to be_nil
    end

    it "passes with valid record data" do
      context = {
        batch_properties: Grit::Compounds::BatchProperty.where(compound_type_id: [ compound_type.id, nil ]),
        db_property_names: Grit::Compounds::Batch.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "valid_batch",
        "compound_id" => compound.id,
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id
      }

      result = described_class.send(:validate_record, Grit::Compounds::Batch, record, record_props, context)

      expect(result[:has_warnings]).to be_falsey
      expect(record[:record_errors]).to be_nil
    end

    it "handles nil property values for required properties" do
      required_property = create(:grit_compounds_batch_property, :required, :string_type, compound_type: compound_type)

      context = {
        batch_properties: [ required_property ],
        db_property_names: Grit::Compounds::Batch.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "test_batch",
        "compound_id" => compound.id,
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id
        # Note: required property is not provided (nil)
      }

      result = described_class.send(:validate_record, Grit::Compounds::Batch, record, record_props, context)

      expect(result[:has_warnings]).to be_falsey
      # Nil values are skipped in validate_record, so no errors
      expect(record[:record_errors]).to be_nil
    end

    it "handles missing required fields and adds errors" do
      context = {
        batch_properties: [],
        db_property_names: Grit::Compounds::Batch.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        # Missing required fields: compound_id, origin_id
        "compound_type_id" => compound_type.id
      }

      described_class.send(:validate_record, Grit::Compounds::Batch, record, record_props, context)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]).to have_key(:compound_id)
    end
  end

  describe ".validate_block_context (private)" do
    it "returns batch_properties and db_property_names" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Batch", origin_id: origin.id)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_batch_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type)

      context = described_class.send(:validate_block_context, load_set_block)

      expect(context[:batch_properties]).not_to be_nil
      expect(context[:db_property_names]).not_to be_nil
      expect(context[:db_property_names]).to include("name")
      expect(context[:db_property_names]).to include("description")
      expect(context[:db_property_names]).to include("compound_id")
    end
  end

  describe ".block_mapping_fields (private)" do
    it "excludes auto-generated fields" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Batch", origin_id: origin.id)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_batch_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type)

      fields = described_class.send(:block_mapping_fields, load_set_block)
      field_names = fields.map { |f| f[:name] }

      expect(field_names).not_to include("compound_type_id")
      expect(field_names).not_to include("molweight")
      expect(field_names).not_to include("logp")
      expect(field_names).not_to include("molformula")
      expect(field_names).not_to include("number")

      expect(field_names).to include("name")
      expect(field_names).to include("compound_id")
    end
  end

  describe ".block_loading_fields (private)" do
    it "excludes number field" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Batch", origin_id: origin.id)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_batch_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type)

      fields = described_class.send(:block_loading_fields, load_set_block)
      field_names = fields.map { |f| f[:name] }

      expect(field_names).not_to include("number")

      expect(field_names).to include("compound_type_id")
      expect(field_names).to include("compound_id")
      expect(field_names).to include("name")
    end
  end

  describe ".base_record_props (private)" do
    it "returns compound_type_id from load set block" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Batch", origin_id: origin.id)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_batch_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type)

      props = described_class.send(:base_record_props, load_set_block)

      expect(props["compound_type_id"]).not_to be_nil
      expect(props["compound_type_id"]).to eq(compound_type.id)
    end
  end

  describe "negative tests" do
    it "raises error with invalid compound_type_id" do
      invalid_params = {
        name: "invalid-batch-load",
        entity: "Grit::Compounds::Batch",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "test-block",
            separator: ",",
            compound_type_id: -999
          }
        }
      }

      expect {
        described_class.send(:create, invalid_params)
      }.to raise_error(StandardError)
    end

    it "raises error with nil compound_type_id" do
      invalid_params = {
        name: "nil-compound-type-batch-load",
        entity: "Grit::Compounds::Batch",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "test-block",
            separator: ",",
            compound_type_id: nil
          }
        }
      }

      expect {
        described_class.send(:create, invalid_params)
      }.to raise_error(StandardError)
    end
  end
end
