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
  RSpec.describe ExperimentDataSheetRecord, type: :model do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:draft_status) { create(:grit_core_publication_status, :draft) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }

    let(:model) do
      AssayModel.create!(
        name: "Record Test Model",
        assay_type: biochemical,
        publication_status: draft_status
      )
    end

    let(:sheet) do
      s = AssayDataSheetDefinition.create!(
        name: "Record Test Sheet",
        assay_model: model,
        result: true,
        sort: 1
      )

      AssayDataSheetColumn.create!(
        name: "Value", safe_name: "value",
        assay_data_sheet_definition: s, data_type: integer_type,
        sort: 1, required: false
      )

      s.reload
      s.create_table
      s
    end

    let(:experiment) do
      Experiment.create!(
        name: "Record Test Experiment",
        assay_model: model,
        publication_status: draft_status
      )
    end

    let(:klass) do
      k = ExperimentDataSheetRecord.sheet_record_klass(sheet.id)
      k.reset_column_information
      k
    end

    before do
      set_current_user(admin)
    end

    after do
      sheet.drop_table rescue nil
      Experiment.delete(experiment.id) rescue nil
      model.destroy rescue nil
    end

    # --- Permissions ---

    describe "permissions" do
      it "entity_crud returns correct roles" do
        crud = ExperimentDataSheetRecord.entity_crud
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

    # --- sheet_record_klass ---

    describe ".sheet_record_klass" do
      it "returns an ActiveRecord class" do
        k = ExperimentDataSheetRecord.sheet_record_klass(sheet.id)
        expect(k).to be < ActiveRecord::Base
        expect(k.table_name).to eq(sheet.table_name)
      end
    end

    # --- create ---

    describe ".create" do
      it "builds a record in the dynamic table" do
        # Force lazy lets
        klass
        experiment

        expect {
          ExperimentDataSheetRecord.create(
            "assay_data_sheet_definition_id" => sheet.id,
            "experiment_id" => experiment.id,
            "value" => 99
          )
        }.to change { klass.count }.by(1)
      end

      it "sets experiment_id on the record" do
        record = ExperimentDataSheetRecord.create(
          "assay_data_sheet_definition_id" => sheet.id,
          "experiment_id" => experiment.id,
          "value" => 42
        )
        expect(record.experiment_id).to eq(experiment.id)
      end

      it "sets created_by via callback" do
        record = ExperimentDataSheetRecord.create(
          "assay_data_sheet_definition_id" => sheet.id,
          "experiment_id" => experiment.id,
          "value" => 10
        )
        expect(record.created_by).to eq("admin")
      end
    end

    # --- update ---

    describe ".update" do
      it "modifies a record" do
        record = klass.create!(experiment_id: experiment.id, value: 1)

        ExperimentDataSheetRecord.update(
          "assay_data_sheet_definition_id" => sheet.id,
          "id" => record.id,
          "value" => 99
        )

        expect(record.reload.value).to eq(99)
      end

      it "sets updated_by via callback" do
        record = klass.create!(experiment_id: experiment.id, value: 1)

        ExperimentDataSheetRecord.update(
          "assay_data_sheet_definition_id" => sheet.id,
          "id" => record.id,
          "value" => 50
        )

        expect(record.reload.updated_by).to eq("admin")
      end
    end

    # --- by_experiment ---

    describe ".by_experiment" do
      it "returns only records for the given experiment" do
        experiment2 = Experiment.create!(
          name: "Second Experiment",
          assay_model: model,
          publication_status: draft_status
        )

        klass.create!(experiment_id: experiment.id, value: 1)
        klass.create!(experiment_id: experiment.id, value: 2)
        klass.create!(experiment_id: experiment2.id, value: 3)

        result = ExperimentDataSheetRecord.by_experiment(
          { "experiment_id" => experiment.id,
            "assay_data_sheet_definition_id" => sheet.id }.with_indifferent_access
        )

        expect(result.count(:all)).to eq(2)

        klass.where(experiment_id: experiment2.id).delete_all
        Experiment.delete(experiment2.id)
      end

      it "raises without experiment_id" do
        expect {
          ExperimentDataSheetRecord.by_experiment(
            "assay_data_sheet_definition_id" => sheet.id
          )
        }.to raise_error(RuntimeError)
      end

      it "raises without assay_data_sheet_definition_id" do
        expect {
          ExperimentDataSheetRecord.by_experiment(
            "experiment_id" => experiment.id
          )
        }.to raise_error(RuntimeError)
      end
    end

    # --- detailed ---

    describe ".detailed" do
      it "raises without assay_data_sheet_definition_id" do
        expect {
          ExperimentDataSheetRecord.detailed({})
        }.to raise_error(RuntimeError)
      end

      it "returns a scoped query including custom columns" do
        klass.create!(experiment_id: experiment.id, value: 77)

        result = ExperimentDataSheetRecord.detailed(
          "assay_data_sheet_definition_id" => sheet.id
        )

        expect(result).not_to be_nil
        record = result.order(:id).first
        expect(record).to respond_to(:value)
        expect(record.value).to eq(77)
      end
    end

    # --- entity_fields / entity_columns ---

    describe ".entity_fields" do
      it "returns fields for the sheet" do
        fields = ExperimentDataSheetRecord.entity_fields(
          assay_data_sheet_definition_id: sheet.id
        )
        field_names = fields.map { |f| f[:name] }
        expect(field_names).to include("value")
      end
    end

    describe ".entity_columns" do
      it "returns columns for the sheet" do
        columns = ExperimentDataSheetRecord.entity_columns(
          assay_data_sheet_definition_id: sheet.id
        )
        column_names = columns.map { |c| c[:name] }
        expect(column_names).to include("value")
      end
    end
  end
end
