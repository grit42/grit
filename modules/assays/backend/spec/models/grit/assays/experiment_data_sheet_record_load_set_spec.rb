# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/assays.
#
# @grit42/assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/assays. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

module Grit::Assays
  # NOTE: This spec file tests ExperimentDataSheetRecordLoadSetBlock.
  # The file name references "load_set" but the actual model is LoadSetBlock.
  RSpec.describe ExperimentDataSheetRecordLoadSetBlock, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

    before do
      set_current_user(admin)
    end

    # --- Basic Model Behavior ---

    describe "model behavior" do
      it "class exists and includes GritEntityRecord" do
        expect(defined?(ExperimentDataSheetRecordLoadSetBlock)).to be_truthy
        expect(ExperimentDataSheetRecordLoadSetBlock.include?(Grit::Core::GritEntityRecord)).to be true
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to load_set_block" do
        association = ExperimentDataSheetRecordLoadSetBlock.reflect_on_association(:load_set_block)
        expect(association).to be_present
        expect(association.macro).to eq(:belongs_to)
        expect(association.options[:class_name]).to eq("Grit::Core::LoadSetBlock")
      end

      it "belongs to assay_data_sheet_definition" do
        association = ExperimentDataSheetRecordLoadSetBlock.reflect_on_association(:assay_data_sheet_definition)
        expect(association).to be_present
        expect(association.macro).to eq(:belongs_to)
      end
    end

    # --- entity_fields ---

    describe ".entity_fields" do
      it "filters to experiment_id and assay_data_sheet_definition_id" do
        fields = ExperimentDataSheetRecordLoadSetBlock.entity_fields
        field_names = fields.map { |f| f[:name] }

        expect(field_names).to include("experiment_id")
        expect(field_names).to include("assay_data_sheet_definition_id")
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = ExperimentDataSheetRecordLoadSetBlock.entity_crud

        expect(crud[:create]).to include("Administrator")
        expect(crud[:create]).to include("AssayAdministrator")
        expect(crud[:create]).to include("AssayUser")
        expect(crud[:update]).to include("Administrator")
        expect(crud[:update]).to include("AssayAdministrator")
        expect(crud[:update]).to include("AssayUser")
        expect(crud[:destroy]).to include("Administrator")
        expect(crud[:destroy]).to include("AssayAdministrator")
        expect(crud[:destroy]).to include("AssayUser")
        expect(crud[:read]).to be_empty
      end
    end

    # Note: Full testing of load set blocks requires load_set fixtures from
    # core module and integration with the data loading pipeline.
  end
end
