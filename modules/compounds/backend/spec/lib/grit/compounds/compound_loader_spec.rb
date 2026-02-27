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

RSpec.describe Grit::Compounds::CompoundLoader do
  let(:origin) { create(:grit_core_origin) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:valid_molfile) do
    File.read(File.join(FILE_FIXTURE_PATH, "simple.sdf")).split("M  END").first + "M  END"
  end

  before do
    admin = create(:grit_core_user, :admin, :with_admin_role)
    Grit::Core::UserSession.create(admin)
  end

  describe ".block_fields" do
    it "returns block fields including compound-specific fields" do
      params = { entity: "Grit::Compounds::Compound" }
      fields = described_class.block_fields(params)

      expect(fields.any? { |f| f[:name] == "separator" }).to be_truthy
      separator_field = fields.find { |f| f[:name] == "separator" }
      expect(separator_field[:select][:options].any? { |opt| opt[:value] == "$$$$" }).to be_truthy
    end
  end

  describe ".block_set_data_fields" do
    it "returns block set data fields" do
      params = { entity: "Grit::Compounds::Compound" }
      fields = described_class.block_set_data_fields(params)

      field_names = fields.map { |f| f[:name] }
      expect(field_names).to include("separator")
      expect(field_names).to include("structure_format")
    end
  end

  describe "SDF parsing" do
    it "extracts columns from SDF file content" do
      sdf_content = File.read(File.join(FILE_FIXTURE_PATH, "simple.sdf"))

      io = StringIO.new(sdf_content)
      columns = Grit::Compounds::SDF.properties(io)
        .each_with_index.map { |h, index| { name: "col_#{index}", display_name: h.strip } }

      expect(columns.any? { |col| col[:display_name] == "molecule" }).to be_truthy
      expect(columns.any? { |col| col[:display_name] == "SMILES" }).to be_truthy
      expect(columns.any? { |col| col[:display_name] == "MOLWEIGHT" }).to be_truthy
    end

    it "extracts records from SDF content" do
      sdf_content = File.read(File.join(FILE_FIXTURE_PATH, "multiple.sdf"))

      records = []
      io = StringIO.new(sdf_content)
      Grit::Compounds::SDF.each_record(io) do |record, recordno|
        records << record
      end

      expect(records.length).to eq(2)
      expect(records.first["molecule"]).to include("M  END")
      expect(records.second["molecule"]).to include("M  END")
    end
  end

  describe ".validate_record (private)" do
    it "validates compound property values with valid type" do
      string_property = create(:grit_compounds_compound_property, :string_type, compound_type: compound_type)

      context = {
        structure_format: "molfile",
        compound_properties: [ string_property ],
        db_property_names: Grit::Compounds::Compound.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "test_compound",
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id,
        string_property.safe_name => "valid_string_value"
      }

      described_class.send(:validate_record, Grit::Compounds::Compound, record, record_props, context)

      expect(record[:record_errors]).to be_nil
    end

    it "passes with valid record data" do
      context = {
        structure_format: "molfile",
        compound_properties: Grit::Compounds::CompoundProperty.where(compound_type_id: [ compound_type.id, nil ]),
        db_property_names: Grit::Compounds::Compound.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "valid_compound",
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id
      }

      result = described_class.send(:validate_record, Grit::Compounds::Compound, record, record_props, context)

      expect(result[:has_warnings]).to be_falsey
      expect(record[:record_errors]).to be_nil
    end

    it "handles missing required fields and adds errors" do
      context = {
        structure_format: "molfile",
        compound_properties: [],
        db_property_names: Grit::Compounds::Compound.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        # Missing required fields: name, origin_id
        "compound_type_id" => compound_type.id
      }

      described_class.send(:validate_record, Grit::Compounds::Compound, record, record_props, context)

      expect(record[:record_errors]).not_to be_nil
      expect(record[:record_errors]).to have_key(:origin_id)
    end
  end

  describe ".validate_block_context (private)" do
    it "returns structure_format and properties" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Compound", origin: origin)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_compound_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type,
             structure_format: "molfile")

      context = described_class.send(:validate_block_context, load_set_block)

      expect(context[:structure_format]).to eq("molfile")
      expect(context[:compound_properties]).not_to be_nil
      expect(context[:db_property_names]).not_to be_nil
      expect(context[:db_property_names]).to include("name")
      expect(context[:db_property_names]).to include("description")
    end
  end

  describe ".block_mapping_fields (private)" do
    it "excludes auto-generated fields" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Compound", origin: origin)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_compound_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type,
             structure_format: "molfile")

      fields = described_class.send(:block_mapping_fields, load_set_block)
      field_names = fields.map { |f| f[:name] }

      expect(field_names).not_to include("compound_type_id")
      expect(field_names).not_to include("molweight")
      expect(field_names).not_to include("logp")
      expect(field_names).not_to include("molformula")
      expect(field_names).not_to include("number")

      expect(field_names).to include("name")
      expect(field_names).to include("molecule")
    end
  end

  describe ".block_loading_fields (private)" do
    it "converts mol type to text" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Compound", origin: origin)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_compound_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type,
             structure_format: "molfile")

      fields = described_class.send(:block_loading_fields, load_set_block)

      mol_field = fields.find { |f| f[:name] == "molecule" }
      expect(mol_field).not_to be_nil
      expect(mol_field[:type]).to eq("text")
    end

    it "excludes calculated fields" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Compound", origin: origin)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_compound_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type,
             structure_format: "molfile")

      fields = described_class.send(:block_loading_fields, load_set_block)
      field_names = fields.map { |f| f[:name] }

      expect(field_names).not_to include("molweight")
      expect(field_names).not_to include("logp")
      expect(field_names).not_to include("molformula")
      expect(field_names).not_to include("number")

      expect(field_names).to include("compound_type_id")
    end
  end

  describe ".base_record_props (private)" do
    it "returns compound_type_id from load set block" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Compound", origin: origin)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_compound_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type,
             structure_format: "molfile")

      props = described_class.send(:base_record_props, load_set_block)

      expect(props["compound_type_id"]).not_to be_nil
      expect(props["compound_type_id"]).to eq(compound_type.id)
    end
  end

  describe "negative tests" do
    it "raises error with invalid compound_type_id" do
      invalid_params = {
        name: "invalid-compound-load",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "test-block",
            separator: "$$$$",
            compound_type_id: -999,
            structure_format: "molfile"
          }
        }
      }

      expect {
        described_class.send(:create, invalid_params)
      }.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "raises error with nil compound_type_id" do
      invalid_params = {
        name: "nil-compound-type-load",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "test-block",
            separator: "$$$$",
            compound_type_id: nil,
            structure_format: "molfile"
          }
        }
      }

      expect {
        described_class.send(:create, invalid_params)
      }.to raise_error(ActiveRecord::RecordInvalid)
    end
  end

  describe "CSV branch" do
    it "columns_from_file uses CSV parser when structure_format is not molfile" do
      load_set = Grit::Core::LoadSet.create!(
        name: "csv-test-load-set",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id
      )

      load_set_block = Grit::Core::LoadSetBlock.create!(
        name: "csv-test-block",
        load_set_id: load_set.id,
        status_id: Grit::Core::LoadSetStatus.find_by(name: "Created").id,
        separator: ",",
        has_errors: false,
        has_warnings: false
      )

      load_set_block.data.attach(
        io: File.open(File.join(FILE_FIXTURE_PATH, "compounds.csv")),
        filename: "compounds.csv",
        content_type: "text/csv"
      )

      Grit::Compounds::CompoundLoadSetBlock.create!(
        load_set_block_id: load_set_block.id,
        compound_type_id: compound_type.id,
        structure_format: "smiles"
      )

      columns = described_class.send(:columns_from_file, load_set_block)

      expect(columns.length).to eq(3)
      expect(columns[0][:name]).to eq("col_0")
      expect(columns[0][:display_name]).to eq("SMILES")
      expect(columns[1][:name]).to eq("col_1")
      expect(columns[1][:display_name]).to eq("Name")
      expect(columns[2][:name]).to eq("col_2")
      expect(columns[2][:display_name]).to eq("Description")
    ensure
      load_set&.destroy
    end

    it "columns_from_file uses SDF parser when structure_format is molfile" do
      load_set = create(:grit_core_load_set, entity: "Grit::Compounds::Compound", origin: origin)
      load_set_block = create(:grit_core_load_set_block, load_set: load_set)
      create(:grit_compounds_compound_load_set_block,
             load_set_block: load_set_block,
             compound_type: compound_type,
             structure_format: "molfile")

      load_set_block.data.attach(
        io: File.open(File.join(FILE_FIXTURE_PATH, "simple.sdf")),
        filename: "simple.sdf",
        content_type: "chemical/x-mdl-sdfile"
      )

      columns = described_class.send(:columns_from_file, load_set_block)

      expect(columns.any? { |col| col[:display_name] == "molecule" }).to be_truthy
      expect(columns.any? { |col| col[:display_name] == "SMILES" }).to be_truthy
    end

    it "records_from_file uses CSV parser when structure_format is not molfile" do
      load_set = Grit::Core::LoadSet.create!(
        name: "csv-records-test",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id
      )

      load_set_block = Grit::Core::LoadSetBlock.create!(
        name: "csv-records-block",
        load_set_id: load_set.id,
        status_id: Grit::Core::LoadSetStatus.find_by(name: "Created").id,
        separator: ",",
        headers: '[{"name": "col_0", "display_name": "SMILES"}, {"name": "col_1", "display_name": "Name"}, {"name": "col_2", "display_name": "Description"}]',
        has_errors: false,
        has_warnings: false
      )

      load_set_block.data.attach(
        io: File.open(File.join(FILE_FIXTURE_PATH, "compounds.csv")),
        filename: "compounds.csv",
        content_type: "text/csv"
      )

      Grit::Compounds::CompoundLoadSetBlock.create!(
        load_set_block_id: load_set_block.id,
        compound_type_id: compound_type.id,
        structure_format: "smiles"
      )

      records = []
      described_class.send(:records_from_file, load_set_block) do |record|
        records << record
      end

      expect(records.length).to eq(2)
      expect(records[0]).to include("Ethanol")
    ensure
      load_set&.destroy
    end
  end
end
