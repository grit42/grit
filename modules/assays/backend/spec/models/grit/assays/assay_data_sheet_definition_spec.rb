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
  RSpec.describe AssayDataSheetDefinition, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:draft_status) { create(:grit_core_publication_status, :draft) }
    let(:published_status) { create(:grit_core_publication_status, :published) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }
    let(:string_type) { create(:grit_core_data_type, :string) }

    let(:draft_model) do
      create(:grit_assays_assay_model, :draft, assay_type: biochemical)
    end

    let(:published_model) do
      create(:grit_assays_assay_model, :published, assay_type: biochemical)
    end

    let(:draft_sheet) do
      sheet = AssayDataSheetDefinition.create!(
        name: "Results",
        assay_model: draft_model,
        result: true,
        sort: 1
      )
      AssayDataSheetColumn.create!(
        name: "Concentration", safe_name: "concentration",
        assay_data_sheet_definition: sheet, data_type: integer_type,
        sort: 1, required: false
      )
      AssayDataSheetColumn.create!(
        name: "Response", safe_name: "response",
        assay_data_sheet_definition: sheet, data_type: integer_type,
        sort: 2, required: false
      )
      sheet
    end

    let(:published_sheet) do
      AssayDataSheetDefinition.create!(
        name: "Viability Results",
        assay_model: published_model,
        result: true,
        sort: 1
      )
    end

    before do
      Grit::Core::UserSession.create(admin)
    end

    # --- Factories ---

    describe "factories" do
      it "creates records correctly" do
        expect(draft_sheet).not_to be_nil
        expect(published_sheet).not_to be_nil
        expect(draft_sheet.name).to eq("Results")
        expect(published_sheet.name).to eq("Viability Results")
      end
    end

    # --- Associations ---

    describe "associations" do
      it "belongs to assay_model" do
        expect(draft_sheet.assay_model).to eq(draft_model)
      end

      it "has many assay_data_sheet_columns" do
        expect(draft_sheet.assay_data_sheet_columns.count).to eq(2)
        columns = draft_sheet.assay_data_sheet_columns.order(:sort)
        expect(columns.first.safe_name).to eq("concentration")
        expect(columns.second.safe_name).to eq("response")
      end
    end

    # --- Validations ---

    describe "validations" do
      it "requires name" do
        sheet = AssayDataSheetDefinition.new(
          assay_model: draft_model,
          result: true
        )
        expect(sheet).not_to be_valid
        expect(sheet.errors[:name]).to include("can't be blank")
      end

      it "requires assay_model" do
        sheet = AssayDataSheetDefinition.new(
          name: "Test Sheet",
          result: true
        )
        expect(sheet).not_to be_valid
        expect(sheet.errors[:assay_model]).to include("must exist")
      end
    end

    # --- Publication Status Check ---

    describe "publication status check" do
      it "can modify sheet on draft model" do
        draft_sheet.description = "Updated description"
        expect(draft_sheet.save).to be true
        expect(draft_sheet.reload.description).to eq("Updated description")
      end

      it "cannot modify sheet on published model" do
        expect {
          published_sheet.update!(description: "Cannot change this")
        }.to raise_error(RuntimeError)
      end
    end

    # --- Table Name ---

    describe "#table_name" do
      it "returns ds_{id}" do
        expect(draft_sheet.table_name).to eq("ds_#{draft_sheet.id}")
      end
    end

    # --- Create/Drop Table ---

    describe "create/drop table" do
      it "create_table creates a PostgreSQL table" do
        model = AssayModel.create!(
          name: "Table Create Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Table Create Test Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        AssayDataSheetColumn.create!(
          name: "Integer Col", safe_name: "int_col",
          assay_data_sheet_definition: sheet, data_type: integer_type,
          sort: 1, required: true
        )

        AssayDataSheetColumn.create!(
          name: "String Col", safe_name: "str_col",
          assay_data_sheet_definition: sheet, data_type: string_type,
          sort: 2, required: false
        )

        sheet.reload

        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be false

        sheet.create_table

        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be true

        columns = ActiveRecord::Base.connection.columns(sheet.table_name)
        column_names = columns.map(&:name)

        expect(column_names).to include("id")
        expect(column_names).to include("created_by")
        expect(column_names).to include("created_at")
        expect(column_names).to include("updated_by")
        expect(column_names).to include("updated_at")
        expect(column_names).to include("experiment_id")
        expect(column_names).to include("int_col")
        expect(column_names).to include("str_col")

        sheet.drop_table
        model.destroy
      end

      it "drop_table removes the PostgreSQL table" do
        model = AssayModel.create!(
          name: "Table Drop Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Table Drop Test Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        sheet.create_table
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be true

        sheet.drop_table
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be false

        model.destroy
      end

      it "drop_table handles non-existent table gracefully" do
        model = AssayModel.create!(
          name: "Non-existent Table Test",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Non-existent Table Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        expect { sheet.drop_table }.not_to raise_error

        model.destroy
      end
    end

    # --- sheet_record_klass ---

    describe "#sheet_record_klass" do
      it "returns an ActiveRecord class" do
        model = AssayModel.create!(
          name: "Klass Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Klass Test Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        AssayDataSheetColumn.create!(
          name: "Value", safe_name: "value",
          assay_data_sheet_definition: sheet, data_type: integer_type,
          sort: 1, required: false
        )

        klass = sheet.sheet_record_klass

        expect(klass).to be < ActiveRecord::Base
        expect(klass.table_name).to eq(sheet.table_name)

        model.destroy
      end

      it "can create and query records" do
        model = AssayModel.create!(
          name: "CRUD Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "CRUD Test Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        AssayDataSheetColumn.create!(
          name: "Measurement", safe_name: "measurement",
          assay_data_sheet_definition: sheet, data_type: integer_type,
          sort: 1, required: false
        )

        sheet.reload
        sheet.create_table

        experiment = Experiment.create!(
          name: "CRUD Test Experiment",
          assay_model: model,
          publication_status: draft_status
        )

        klass = sheet.sheet_record_klass
        klass.reset_column_information

        record = klass.create!(
          experiment_id: experiment.id,
          measurement: 42
        )

        expect(record).to be_persisted
        expect(record.measurement).to eq(42)
        expect(record.experiment_id).to eq(experiment.id)
        expect(record.created_by).to eq("admin")

        found = klass.find(record.id)
        expect(found.measurement).to eq(42)

        found.update!(measurement: 100)
        expect(found.reload.measurement).to eq(100)

        found.destroy
        expect(klass.exists?(record.id)).to be false

        sheet.drop_table
        Experiment.delete(experiment.id)
        model.destroy
      end

      it "responds to entity_properties" do
        model = AssayModel.create!(
          name: "Properties Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Properties Test Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        AssayDataSheetColumn.create!(
          name: "Test Value", safe_name: "test_value",
          assay_data_sheet_definition: sheet, data_type: integer_type,
          sort: 1, required: true
        )

        klass = sheet.sheet_record_klass

        properties = klass.entity_properties
        property_names = properties.map { |p| p[:name] }
        expect(property_names).to include("created_at")
        expect(property_names).to include("created_by")
        expect(property_names).to include("updated_at")
        expect(property_names).to include("updated_by")
        expect(property_names).to include("test_value")

        model.destroy
      end

      it "detailed scope includes columns" do
        model = AssayModel.create!(
          name: "Detailed Test Model",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Detailed Test Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        AssayDataSheetColumn.create!(
          name: "Detail Value", safe_name: "detail_value",
          assay_data_sheet_definition: sheet, data_type: integer_type,
          sort: 1, required: false
        )

        sheet.reload
        sheet.create_table

        experiment = Experiment.create!(
          name: "Detailed Test Experiment",
          assay_model: model,
          publication_status: draft_status
        )

        klass = sheet.sheet_record_klass
        klass.reset_column_information

        klass.create!(experiment_id: experiment.id, detail_value: 123)

        result = klass.detailed.order(:id).first

        expect(result).not_to be_nil
        expect(result).to respond_to(:detail_value)
        expect(result.detail_value).to eq(123)

        sheet.drop_table
        Experiment.delete(experiment.id)
        model.destroy
      end
    end

    # --- Dependent Destroy ---

    describe "dependent destroy" do
      it "destroying model destroys dependent sheet definitions via cascade" do
        model = AssayModel.create!(
          name: "Cascade Delete Test",
          assay_type: biochemical,
          publication_status: draft_status
        )

        sheet = AssayDataSheetDefinition.create!(
          name: "Cascade Delete Sheet",
          assay_model: model,
          result: true,
          sort: 1
        )

        sheet_id = sheet.id

        model.destroy

        expect(AssayDataSheetDefinition.exists?(sheet_id)).to be false
      end

      it "sheet has_many columns with dependent destroy" do
        reflection = AssayDataSheetDefinition.reflect_on_association(:assay_data_sheet_columns)
        expect(reflection).not_to be_nil
        expect(reflection.options[:dependent]).to eq(:destroy)
      end
    end
  end
end
