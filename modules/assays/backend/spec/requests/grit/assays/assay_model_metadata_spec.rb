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
  RSpec.describe "Assay Model Metadata API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }
    let(:published_model) { create(:grit_assays_assay_model, :published, assay_type: biochemical) }

    let(:species_def) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    let(:draft_model_species) do
      AssayModelMetadatum.create!(
        assay_model: draft_model,
        assay_metadata_definition: species_def
      )
    end

    before do
      set_current_user(admin)
    end

    path "/api/grit/assays/assay_model_metadata" do
      get "Lists all assay model metadata" do
        tags "Assays - Assay Model Metadata"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay model metadata listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Creates an assay model metadatum" do
        tags "Assays - Assay Model Metadata"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "201", "assay model metadatum created on draft model" do
          before { login_as(admin) }

          let(:new_definition) do
            AssayMetadataDefinition.create!(
              name: "Test Create Definition",
              safe_name: "test_create_def",
              vocabulary: vocabulary
            )
          end

          let(:params) do
            { assay_model_id: draft_model.id, assay_metadata_definition_id: new_definition.id }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
          end
        end

        response "500", "cannot create assay model metadatum on published model" do
          before { login_as(admin) }

          let(:new_definition) do
            AssayMetadataDefinition.create!(
              name: "Test Published Definition",
              safe_name: "test_pub_def",
              vocabulary: vocabulary
            )
          end

          let(:params) do
            { assay_model_id: published_model.id, assay_metadata_definition_id: new_definition.id }
          end

          run_test!
        end
      end
    end

    path "/api/grit/assays/assay_model_metadata/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an assay model metadatum" do
        tags "Assays - Assay Model Metadata"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay model metadatum shown" do
          let(:id) { draft_model_species.id }
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["id"]).to eq(draft_model_species.id)
          end
        end
      end

      delete "Destroys an assay model metadatum on draft model" do
        tags "Assays - Assay Model Metadata"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay model metadatum destroyed" do
          before { login_as(admin) }

          let(:id) do
            definition = AssayMetadataDefinition.create!(
              name: "Destroy Test Definition",
              safe_name: "destroy_test_def",
              vocabulary: vocabulary
            )

            post "/api/grit/assays/assay_model_metadata", params: {
              assay_model_id: draft_model.id,
              assay_metadata_definition_id: definition.id
            }, as: :json

            JSON.parse(response.body)["data"]["id"]
          end

          run_test!
        end
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/assay_model_metadata", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
