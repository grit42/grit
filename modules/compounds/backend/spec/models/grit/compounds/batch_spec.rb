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

RSpec.describe Grit::Compounds::Batch, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:origin) { create(:grit_core_origin) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:compound) { create(:grit_compounds_compound, origin: origin, compound_type: compound_type) }
  let(:batch) { create(:grit_compounds_batch, compound: compound, compound_type: compound_type, origin: origin) }

  before(:each) do
    # admin = create(:grit_core_user, :admin, :with_admin_role)
    set_current_user(admin)
  end

  describe "associations" do
    it "belongs to compound" do
      expect(batch.compound).to eq(compound)
    end

    it "belongs to compound_type" do
      expect(batch.compound_type).to eq(compound_type)
    end

    it "belongs to origin" do
      expect(batch.origin_id).to eq(origin.id)
    end

    it "responds to batch_property_values" do
      expect(batch).to respond_to(:batch_property_values)
    end
  end

  describe "#set_number callback" do
    it "auto-generates BATCH prefixed number on create" do
      new_batch = described_class.new(
        name: "test_batch",
        origin_id: origin.id,
        compound_type_id: compound_type.id,
        compound_id: compound.id
      )
      new_batch.save!

      expect(new_batch.number).not_to be_nil
      expect(new_batch.number).to start_with("BATCH")
      expect(new_batch.number).to match(/^BATCH\d{7}$/)
    end
  end

  describe ".create (custom create)" do
    it "creates batch with basic properties" do
      result = described_class.create({
        "name" => "new_batch",
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id,
        "compound_id" => compound.id
      })

      expect(result[:batch_id]).not_to be_nil

      created_batch = described_class.find(result[:batch_id])
      expect(created_batch.name).to eq("new_batch")
      expect(created_batch.compound_id).to eq(compound.id)
    end
  end

  describe ".detailed scope" do
    it "includes compound data" do
      result = described_class.detailed.where(id: batch.id).order(:id).first

      expect(result).not_to be_nil
      expect(result).to respond_to(:compound_id__number)
      expect(result).to respond_to(:compound_id__name)
      expect(result).to respond_to(:origin_id__name)
      expect(result).to respond_to(:compound_type_id__name)
    end
  end

  describe ".compound_type_properties" do
    it "returns type-specific properties" do
      properties = described_class.compound_type_properties(compound_type_id: compound_type.id)
      expect(properties).to be_an(Array)

      if properties.any?
        first_prop = properties.first
        expect(first_prop).to have_key(:name)
        expect(first_prop).to have_key(:display_name)
        expect(first_prop).to have_key(:type)
      end
    end

    it "returns all properties when no type specified" do
      all_properties = described_class.compound_type_properties
      specific_properties = described_class.compound_type_properties(compound_type_id: compound_type.id)

      expect(all_properties.length).to be >= specific_properties.length
    end
  end
end
