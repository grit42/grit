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
  RSpec.describe "Experiment Metadata Templates API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:vocab_item) { create(:grit_core_vocabulary_item, vocabulary: vocabulary) }

    let(:species_def) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    before do
      Grit::Core::UserSession.create(admin)
    end

    path "/api/grit/assays/experiment_metadata_templates" do
      get "Lists all experiment metadata templates" do
        tags "Assays - Experiment Metadata Templates"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "experiment metadata templates listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Creates an experiment metadata template" do
        tags "Assays - Experiment Metadata Templates"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "201", "template created" do
          before { login_as(admin) }

          let(:params) do
            {
              name: "New Template",
              description: "A new template",
              species_def.safe_name => vocab_item.id
            }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["name"]).to eq("New Template")

            # Cleanup
            ExperimentMetadataTemplate.find(json["data"]["id"]).destroy
          end
        end

        response "422", "template not created without name" do
          before { login_as(admin) }

          let(:params) { { description: "Missing name" } }

          run_test!
        end
      end
    end

    # Note: Full CRUD tests require API-based record creation
    # These structural tests verify the controller is accessible

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/experiment_metadata_templates", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
