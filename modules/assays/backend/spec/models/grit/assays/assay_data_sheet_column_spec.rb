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
  RSpec.describe AssayDataSheetColumn, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:draft_status) { create(:grit_core_publication_status, :draft) }
    let(:published_status) { create(:grit_core_publication_status, :published) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }

    let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }
    let(:published_model) { create(:grit_assays_assay_model, :published, assay_type: biochemical) }

    let(:draft_sheet) do
      AssayDataSheetDefinition.create!(
        name: "Results", assay_model: draft_model, result: true, sort: 1
      )
    end

    let(:published_model_for_sheet) do
      create(:grit_assays_assay_model, :draft, assay_type: biochemical)
    end

    let(:published_sheet) do
      # Create sheet while model is still draft, then publish the model
      sheet = AssayDataSheetDefinition.create!(
        name: "Viability Results", assay_model: published_model_for_sheet, result: true, sort: 1
      )
      published_model_for_sheet.update_column(:publication_status_id, published_status.id)
      sheet.reload
    end

    let(:draft_column) do
      AssayDataSheetColumn.create!(
        name: "Concentration", safe_name: "concentration",
        assay_data_sheet_definition: draft_sheet, data_type: integer_type,
        sort: 1, required: false
      )
    end

    let(:published_column) do
      # published_sheet already publishes the model, so just create the column
      # before publishing by using a fresh model
      model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
      sheet = AssayDataSheetDefinition.create!(
        name: "Published Column Sheet", assay_model: model, result: true, sort: 1
      )
      col = AssayDataSheetColumn.create!(
        name: "Viability", safe_name: "viability",
        assay_data_sheet_definition: sheet, data_type: integer_type,
        sort: 1, required: false
      )
      model.update_column(:publication_status_id, published_status.id)
      col.reload
    end

    before do
      set_current_user(admin)
    end

    # --- Factories ---

    describe "factories" do
      it "creates records correctly" do
        expect(draft_column).not_to be_nil
        expect(draft_column.name).to eq("Concentration")
        expect(draft_column.safe_name).to eq("concentration")
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to assay_data_sheet_definition" do
        expect(draft_column.assay_data_sheet_definition).to eq(draft_sheet)
      end

      it "belongs to data_type" do
        expect(draft_column.data_type).to eq(integer_type)
      end

      it "has many data_table_columns" do
        expect(draft_column).to respond_to(:data_table_columns)
        expect(draft_column.data_table_columns).to be_a(ActiveRecord::Associations::CollectionProxy)
      end
    end

    # --- Validations ---

    describe "validations" do
      it "requires name to be unique within data sheet" do
        draft_column # create first
        column = AssayDataSheetColumn.new(
          name: draft_column.name,
          safe_name: "unique_safe",
          assay_data_sheet_definition: draft_sheet,
          data_type: integer_type,
          sort: 10, required: false
        )
        expect(column).not_to be_valid
        expect(column.errors[:name].any? { |e| e.include?("has already been taken") }).to be true
      end

      it "requires safe_name to be unique within data sheet" do
        draft_column # create first
        column = AssayDataSheetColumn.new(
          name: "Unique Name",
          safe_name: draft_column.safe_name,
          assay_data_sheet_definition: draft_sheet,
          data_type: integer_type,
          sort: 10, required: false
        )
        expect(column).not_to be_valid
        expect(column.errors[:safe_name].any? { |e| e.include?("has already been taken") }).to be true
      end

      it "safe_name cannot conflict with reserved names" do
        column = AssayDataSheetColumn.new(
          name: "Conflict",
          safe_name: "experiment_id",
          assay_data_sheet_definition: draft_sheet,
          data_type: integer_type,
          sort: 10, required: false
        )
        expect(column).not_to be_valid
        expect(column.errors[:safe_name].any? { |e| e.include?("cannot be used") }).to be true
      end

      it "allows creation with valid attributes on draft model" do
        column = AssayDataSheetColumn.new(
          name: "Valid Column",
          safe_name: "valid_column",
          description: "A valid column",
          assay_data_sheet_definition: draft_sheet,
          data_type: integer_type,
          sort: 10, required: false
        )
        expect(column).to be_valid
      end
    end

    # --- Callbacks ---

    describe "callbacks" do
      it "cannot modify column of published assay model" do
        expect {
          published_column.update!(name: "Cannot Change")
        }.to raise_error(RuntimeError)
      end

      it "can modify column of draft assay model" do
        draft_column.name = "Updated Column Name"
        expect(draft_column.save).to be true
        expect(draft_column.reload.name).to eq("Updated Column Name")
      end

      it "cannot create column on published assay model" do
        column = AssayDataSheetColumn.new(
          name: "New Column",
          safe_name: "new_column",
          assay_data_sheet_definition: published_sheet,
          data_type: integer_type,
          sort: 10, required: false
        )
        expect {
          column.save!
        }.to raise_error(RuntimeError)
      end
    end

    # --- detailed scope ---

    describe ".detailed" do
      it "includes assay_model info" do
        result = AssayDataSheetColumn.detailed.find(draft_column.id)
        expect(result).to respond_to(:assay_model_id)
        expect(result).to respond_to(:assay_model_id__name)
      end
    end

    # --- CRUD Permissions ---

    describe "CRUD permissions" do
      it "entity_crud_with is configured correctly" do
        crud = AssayDataSheetColumn.entity_crud

        expect(crud[:create]).to include("Administrator")
        expect(crud[:create]).to include("AssayAdministrator")
        expect(crud[:update]).to include("Administrator")
        expect(crud[:update]).to include("AssayAdministrator")
        expect(crud[:destroy]).to include("Administrator")
        expect(crud[:destroy]).to include("AssayAdministrator")
        expect(crud[:read]).to be_empty
      end
    end
  end
end
