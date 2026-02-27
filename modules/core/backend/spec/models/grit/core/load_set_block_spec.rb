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

RSpec.describe Grit::Core::LoadSetBlock, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:mapping_status) { create(:grit_core_load_set_status, :mapping) }
  let(:succeeded_status) { create(:grit_core_load_set_status, :succeeded) }
  let(:errored_status) { create(:grit_core_load_set_status, :errored) }
  let(:load_set) { create(:grit_core_load_set) }

  before(:each) do
    set_current_user(admin)
  end

  # separator_set validation tests
  describe "separator validation" do
    it "accepts a tab separator" do
      block = described_class.new(
        name: "test-block",
        load_set: load_set,
        status: mapping_status,
        separator: "\t",
        headers: [],
        mappings: {}
      )
      block.valid?
      expect(block.errors[:separator]).to be_empty
    end

    it "accepts a comma separator" do
      block = described_class.new(
        name: "test-block",
        load_set: load_set,
        status: mapping_status,
        separator: ",",
        headers: [],
        mappings: {}
      )
      block.valid?
      expect(block.errors[:separator]).to be_empty
    end

    it "rejects a blank separator" do
      block = described_class.new(
        name: "test-block",
        load_set: load_set,
        status: mapping_status,
        separator: "",
        headers: [],
        mappings: {}
      )
      expect(block).not_to be_valid
      expect(block.errors[:separator]).to include("cannot be blank")
    end

    it "rejects a nil separator" do
      block = described_class.new(
        name: "test-block",
        load_set: load_set,
        status: mapping_status,
        separator: nil,
        headers: [],
        mappings: {}
      )
      expect(block).not_to be_valid
      expect(block.errors[:separator]).to include("cannot be blank")
    end
  end

  # check_status callback tests
  describe "check_status callback" do
    it "cannot delete a load set block with succeeded status" do
      succeeded_block = create(:grit_core_load_set_block, :succeeded, load_set: load_set)
      expect(succeeded_block.status.name).to eq("Succeeded")

      result = succeeded_block.destroy
      expect(result).to be_falsy
      expect(described_class.exists?(succeeded_block.id)).to be_truthy
    end

    it "can delete a load set block with mapping status" do
      mapping_block = create(:grit_core_load_set_block, :mapping, load_set: load_set)
      expect(mapping_block.status.name).to eq("Mapping")

      expect(mapping_block.destroy).to be_truthy
      expect(described_class.exists?(mapping_block.id)).to be_falsy
    end

    it "can delete a load set block with errored status" do
      errored_block = create(:grit_core_load_set_block, :errored, load_set: load_set)

      expect(errored_block.destroy).to be_truthy
      expect(described_class.exists?(errored_block.id)).to be_falsy
    end
  end

  # Table name methods
  describe "table name methods" do
    let(:block) { create(:grit_core_load_set_block, :mapping, load_set: load_set) }

    it "loading_records_table_name returns correct format" do
      expect(block.loading_records_table_name).to eq("lsb_#{block.id}")
    end

    it "raw_data_table_name returns correct format" do
      expect(block.raw_data_table_name).to eq("raw_lsb_#{block.id}")
    end
  end

  # entity_fields tests
  describe ".entity_fields" do
    it "returns name and separator fields" do
      fields = described_class.entity_fields
      field_names = fields.map { |f| f[:name] }

      expect(field_names).to include("name")
      expect(field_names).to include("separator")
    end

    it "has select options for separator field" do
      fields = described_class.entity_fields
      separator_field = fields.find { |f| f[:name] == "separator" }

      expect(separator_field[:type]).to eq("select")
      expect(separator_field[:select][:options]).to be_an(Array)
      expect(separator_field[:select][:options].length).to be > 0

      values = separator_field[:select][:options].map { |o| o[:value] }
      expect(values).to include(",")
      expect(values).to include("\t")
      expect(values).to include(";")
    end
  end
end
