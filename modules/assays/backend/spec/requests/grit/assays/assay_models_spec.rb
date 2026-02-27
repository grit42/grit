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
  RSpec.describe "Assay Models API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }

    before do
      Grit::Core::UserSession.create(admin)
    end

    path "/api/grit/assays/assay_models" do
      get "Lists all assay models" do
        tags "Assays - Assay Models"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay models listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Creates an assay model" do
        tags "Assays - Assay Models"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "201", "assay model created with minimal params" do
          before { login_as(admin) }

          let(:params) do
            { name: "New Test Assay", assay_type_id: biochemical.id }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["name"]).to eq("New Test Assay")
          end
        end

        response "422", "assay model not created without name" do
          before { login_as(admin) }

          let(:params) { { assay_type_id: biochemical.id } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be false
          end
        end
      end
    end

    path "/api/grit/assays/assay_models/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an assay model" do
        tags "Assays - Assay Models"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay model shown" do
          let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }
          let(:id) { draft_model.id }
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["id"]).to eq(draft_model.id)
          end
        end
      end

      patch "Updates a draft assay model" do
        tags "Assays - Assay Models"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay model updated" do
          let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }
          let(:id) { draft_model.id }
          before { login_as(admin) }

          let(:params) { { name: "Updated Draft Name" } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(draft_model.reload.name).to eq("Updated Draft Name")
          end
        end
      end

      delete "Destroys a draft assay model" do
        tags "Assays - Assay Models"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay model destroyed" do
          before { login_as(admin) }

          let(:id) do
            post "/api/grit/assays/assay_models",
              params: { name: "To Be Destroyed", assay_type_id: biochemical.id },
              as: :json
            JSON.parse(response.body)["data"]["id"]
          end

          run_test!
        end
      end
    end

    # --- Create with sheets and columns ---

    describe "create with sheets and columns" do
      before { login_as(admin) }

      it "creates assay_model with sheets and columns" do
        expect {
          post "/api/grit/assays/assay_models", params: {
            name: "Assay With Sheets",
            assay_type_id: biochemical.id,
            sheets: [
              {
                name: "Results Sheet",
                result: true,
                sort: 1,
                columns: [
                  {
                    name: "IC50",
                    safe_name: "ic50",
                    sort: 1,
                    required: false,
                    data_type_id: integer_type.id
                  }
                ]
              }
            ]
          }, as: :json
        }.to change(AssayModel, :count).by(1)
          .and change(AssayDataSheetDefinition, :count).by(1)
          .and change(AssayDataSheetColumn, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
      end

      it "newly created assay_model has draft publication status" do
        post "/api/grit/assays/assay_models", params: {
          name: "Draft Status Check",
          assay_type_id: biochemical.id
        }, as: :json

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        created = AssayModel.find(json["data"]["id"])
        expect(created.publication_status.name).to eq("Draft")
      end
    end

    # --- Publish ---

    describe "publish" do
      before { login_as(admin) }

      it "publishes a draft assay_model" do
        post "/api/grit/assays/assay_models", params: {
          name: "To Be Published",
          assay_type_id: biochemical.id,
          sheets: [ { name: "Results", result: true, sort: 1, columns: [] } ]
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]
        sheet = AssayDataSheetDefinition.find_by(assay_model_id: model_id)

        post "/api/grit/assays/assay_models/#{model_id}/publish", as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(AssayModel.find(model_id).publication_status.name).to eq("Published")
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be true

        # Clean up dynamic tables via draft action
        post "/api/grit/assays/assay_models/#{model_id}/draft", as: :json
      end

      it "publish creates dynamic tables for each sheet" do
        post "/api/grit/assays/assay_models", params: {
          name: "Publish Table Creation Test",
          assay_type_id: biochemical.id,
          sheets: [
            { name: "Sheet 1", result: true, sort: 1, columns: [] },
            { name: "Sheet 2", result: false, sort: 2, columns: [] }
          ]
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]
        sheets = AssayDataSheetDefinition.where(assay_model_id: model_id).order(:sort)

        post "/api/grit/assays/assay_models/#{model_id}/publish", as: :json

        expect(response).to have_http_status(:success)
        expect(ActiveRecord::Base.connection.table_exists?(sheets.first.table_name)).to be true
        expect(ActiveRecord::Base.connection.table_exists?(sheets.second.table_name)).to be true

        # Clean up
        post "/api/grit/assays/assay_models/#{model_id}/draft", as: :json
      end
    end

    # --- Draft (unpublish) ---

    describe "draft (unpublish)" do
      before { login_as(admin) }

      it "moves published assay_model back to draft" do
        post "/api/grit/assays/assay_models", params: {
          name: "To Be Drafted",
          assay_type_id: biochemical.id,
          sheets: [ { name: "Sheet", result: true, sort: 1, columns: [] } ]
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]
        sheet = AssayDataSheetDefinition.find_by(assay_model_id: model_id)

        post "/api/grit/assays/assay_models/#{model_id}/publish", as: :json
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be true

        post "/api/grit/assays/assay_models/#{model_id}/draft", as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(AssayModel.find(model_id).publication_status.name).to eq("Draft")
        expect(ActiveRecord::Base.connection.table_exists?(sheet.table_name)).to be false
      end

      it "draft action destroys all experiments" do
        post "/api/grit/assays/assay_models", params: {
          name: "Draft Destroys Experiments",
          assay_type_id: biochemical.id
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]

        post "/api/grit/assays/assay_models/#{model_id}/publish", as: :json
        expect(response).to have_http_status(:success)

        post "/api/grit/assays/experiments", params: {
          name: "Experiment To Destroy",
          assay_model_id: model_id
        }, as: :json
        expect(response).to have_http_status(:created)
        experiment_id = JSON.parse(response.body)["data"]["id"]

        post "/api/grit/assays/assay_models/#{model_id}/draft", as: :json

        expect(response).to have_http_status(:success)
        expect(Experiment.exists?(experiment_id)).to be false
      end
    end

    # --- update_metadata ---

    describe "update_metadata" do
      before { login_as(admin) }

      it "updates metadata for an assay_model" do
        vocabulary = create(:grit_core_vocabulary)
        species_def = create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
        tissue_def = create(:grit_assays_assay_metadata_definition, :tissue_type, vocabulary: vocabulary)

        post "/api/grit/assays/assay_models", params: {
          name: "Metadata Test Model",
          assay_type_id: biochemical.id
        }, as: :json
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]

        expect {
          post "/api/grit/assays/assay_models/#{model_id}/update_metadata", params: {
            assay_model_id: model_id,
            removed: [],
            added: [ species_def.id ]
          }, as: :json
        }.to change(AssayModelMetadatum, :count).by(1)
        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body)["success"]).to be true
        expect(AssayModelMetadatum.exists?(assay_model_id: model_id, assay_metadata_definition_id: species_def.id)).to be true

        # Swap species for tissue_type
        expect {
          post "/api/grit/assays/assay_models/#{model_id}/update_metadata", params: {
            assay_model_id: model_id,
            removed: [ species_def.id ],
            added: [ tissue_def.id ]
          }, as: :json
        }.to change(AssayModelMetadatum, :count).by(0)

        expect(response).to have_http_status(:success)
        expect(AssayModelMetadatum.exists?(assay_model_id: model_id, assay_metadata_definition_id: tissue_def.id)).to be true
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/assay_models", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
