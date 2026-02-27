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
  RSpec.describe "Experiment Metadata API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:vocab_item) { create(:grit_core_vocabulary_item, vocabulary: vocabulary) }
    let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }

    let(:species_def) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    let(:draft_experiment) do
      Experiment.create!(
        name: "Draft Experiment",
        assay_model: draft_model,
        publication_status: create(:grit_core_publication_status, :draft)
      )
    end

    let(:draft_experiment_species) do
      ExperimentMetadatum.create!(
        experiment: draft_experiment,
        assay_metadata_definition: species_def,
        vocabulary: vocabulary,
        vocabulary_item: vocab_item
      )
    end

    before do
      Grit::Core::UserSession.create(admin)
    end

    path "/api/grit/assays/experiment_metadata" do
      get "Lists all experiment metadata" do
        tags "Assays - Experiment Metadata"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "experiment metadata listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end
    end

    path "/api/grit/assays/experiment_metadata/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an experiment metadatum" do
        tags "Assays - Experiment Metadata"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "experiment metadatum shown" do
          let(:id) { draft_experiment_species.id }
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["id"]).to eq(draft_experiment_species.id)
          end
        end
      end
    end

    # Note: Experiment metadata is created/updated/destroyed via experiment
    # create/update actions. Full CRUD testing is covered there.

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/experiment_metadata", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
