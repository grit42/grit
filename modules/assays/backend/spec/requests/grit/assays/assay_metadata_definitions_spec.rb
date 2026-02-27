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
  RSpec.describe "Assay Metadata Definitions API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }

    let(:species) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    before do
      set_current_user(admin)
    end

    # Create a model with species linked (for "in use" tests)
    let(:species_in_use) do
      draft_model = create(:grit_assays_assay_model, :draft, assay_type: biochemical)
      AssayModelMetadatum.create!(assay_model: draft_model, assay_metadata_definition: species)
      species
    end

    path "/api/grit/assays/assay_metadata_definitions" do
      get "Lists all assay metadata definitions" do
        tags "Assays - Assay Metadata Definitions"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay metadata definitions listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Creates an assay metadata definition" do
        tags "Assays - Assay Metadata Definitions"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "201", "assay metadata definition created" do
          before { login_as(admin) }

          let(:params) do
            {
              name: "New Metadata",
              safe_name: "new_metadata",
              description: "A new metadata definition",
              vocabulary_id: vocabulary.id
            }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["name"]).to eq("New Metadata")
          end
        end

        response "422", "not created without name" do
          before { login_as(admin) }

          let(:params) do
            { safe_name: "missing_name", vocabulary_id: vocabulary.id }
          end

          run_test!
        end

        response "422", "not created with invalid safe_name" do
          before { login_as(admin) }

          let(:params) do
            { name: "Invalid Safe Name", safe_name: "1_invalid", vocabulary_id: vocabulary.id }
          end

          run_test!
        end
      end
    end

    path "/api/grit/assays/assay_metadata_definitions/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an assay metadata definition" do
        tags "Assays - Assay Metadata Definitions"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay metadata definition shown" do
          let(:id) { species.id }
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["id"]).to eq(species.id)
          end
        end
      end

      patch "Cannot update assay metadata definition in use" do
        tags "Assays - Assay Metadata Definitions"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "500", "cannot update when in use" do
          let(:id) { species_in_use.id }
          before { login_as(admin) }

          let(:params) { { name: "Updated Species" } }

          run_test!
        end
      end

      delete "Cannot destroy assay metadata definition required in assay model" do
        tags "Assays - Assay Metadata Definitions"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "500", "cannot destroy when in use" do
          let(:id) { species_in_use.id }
          before { login_as(admin) }

          run_test!
        end
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/assay_metadata_definitions", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
