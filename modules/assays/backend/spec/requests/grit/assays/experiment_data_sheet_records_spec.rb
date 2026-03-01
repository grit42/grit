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


require "openapi_helper"

module Grit::Assays
  RSpec.describe "Experiment Data Sheet Records API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }
    let!(:draft_status) { Grit::Core::PublicationStatus.find_or_create_by!(name: "Draft") }
    let!(:published_status) { Grit::Core::PublicationStatus.find_or_create_by!(name: "Published") }

    let(:model) do
      AssayModel.create!(
        name: "Controller Record Test Model",
        assay_type: biochemical,
        publication_status: draft_status
      )
    end

    let(:sheet) do
      s = AssayDataSheetDefinition.create!(
        name: "Controller Record Test Sheet",
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
        name: "Controller Record Test Experiment",
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

    # Helper: create a record via HTTP and return its ID
    def http_create_record(value:, exp: nil)
      target_exp = exp || experiment
      post "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records",
        params: {
          experiment_id: target_exp.id,
          assay_data_sheet_definition_id: sheet.id,
          value: value
        },
        as: :json
      expect(response).to have_http_status(:created)
      JSON.parse(response.body)["data"]["id"]
    end

    # --- Create ---

    describe "create" do
      before { login_as(admin) }

      it "creates a record" do
        # Force lazy lets
        klass
        experiment

        expect {
          post "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records",
            params: {
              experiment_id: experiment.id,
              assay_data_sheet_definition_id: sheet.id,
              value: 42
            },
            as: :json
        }.to change { klass.count }.by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"]["value"]).to eq(42)
      end

      it "does not create record in a published experiment" do
        experiment.update_column(:publication_status_id, published_status.id)

        post "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records",
          params: {
            experiment_id: experiment.id,
            assay_data_sheet_definition_id: sheet.id,
            value: 1
          },
          as: :json

        expect(response).to have_http_status(:internal_server_error)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["errors"]).to match(/published/i)
      end
    end

    # --- Update ---

    describe "update" do
      before { login_as(admin) }

      it "updates a record" do
        record_id = http_create_record(value: 1)

        patch "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records/#{record_id}",
          params: {
            id: record_id,
            experiment_id: experiment.id,
            assay_data_sheet_definition_id: sheet.id,
            value: 99
          },
          as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"]["value"]).to eq(99)
      end

      it "does not update record in a published experiment" do
        record_id = http_create_record(value: 1)
        experiment.update_column(:publication_status_id, published_status.id)

        patch "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records/#{record_id}",
          params: {
            id: record_id,
            experiment_id: experiment.id,
            assay_data_sheet_definition_id: sheet.id,
            value: 99
          },
          as: :json

        expect(response).to have_http_status(:internal_server_error)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["errors"]).to match(/published/i)
      end
    end

    # --- Destroy ---

    describe "destroy" do
      before { login_as(admin) }

      it "destroys a single record" do
        record_id = http_create_record(value: 5)

        expect {
          delete "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records/#{record_id}",
            params: { assay_data_sheet_definition_id: sheet.id },
            as: :json
        }.to change { klass.count }.by(-1)

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
      end

      it "destroys records in bulk" do
        record1_id = http_create_record(value: 10)
        record2_id = http_create_record(value: 20)

        expect {
          delete "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records/destroy",
            params: {
              assay_data_sheet_definition_id: sheet.id,
              ids: "#{record1_id},#{record2_id}"
            },
            as: :json
        }.to change { klass.count }.by(-2)

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
      end

      it "does not destroy record in a published experiment" do
        record_id = http_create_record(value: 5)
        experiment.update_column(:publication_status_id, published_status.id)

        delete "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records/#{record_id}",
          params: { assay_data_sheet_definition_id: sheet.id },
          as: :json

        expect(response).to have_http_status(:internal_server_error)
        json = JSON.parse(response.body)
        expect(json["success"]).to be false
        expect(json["errors"]).to match(/published/i)
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        post "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records",
          params: {
            experiment_id: experiment.id,
            assay_data_sheet_definition_id: sheet.id,
            value: 1
          },
          as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
