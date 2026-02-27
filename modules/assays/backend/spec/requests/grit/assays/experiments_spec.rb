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
require "zip"

module Grit::Assays
  RSpec.describe "Experiments API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }
    let(:vocabulary) { create(:grit_core_vocabulary) }
    let(:vocab_item) { create(:grit_core_vocabulary_item, vocabulary: vocabulary) }
    let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }

    let(:species_def) do
      create(:grit_assays_assay_metadata_definition, :species, vocabulary: vocabulary)
    end

    before do
      set_current_user(admin)
    end

    path "/api/grit/assays/experiments" do
      get "Lists all experiments" do
        tags "Assays - Experiments"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "experiments listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Creates an experiment" do
        tags "Assays - Experiments"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "201", "experiment created" do
          before { login_as(admin) }

          let(:params) do
            { name: "New Test Experiment", assay_model_id: draft_model.id }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["name"]).to eq("New Test Experiment")
          end
        end

        response "422", "experiment not created without name" do
          before { login_as(admin) }

          let(:params) { { assay_model_id: draft_model.id } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be false
          end
        end
      end
    end

    path "/api/grit/assays/experiments/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an experiment" do
        tags "Assays - Experiments"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "experiment shown" do
          before { login_as(admin) }

          let(:id) do
            exp = Experiment.create!(
              name: "Draft Experiment",
              assay_model: draft_model,
              publication_status: create(:grit_core_publication_status, :draft)
            )
            exp.id
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to have_key("data_sheets")
            expect(json["data"]["data_sheets"]).to be_a(Array)
          end
        end
      end

      patch "Updates a draft experiment" do
        tags "Assays - Experiments"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "experiment updated" do
          before { login_as(admin) }

          let(:draft_experiment) do
            Experiment.create!(
              name: "Draft Experiment",
              assay_model: draft_model,
              publication_status: create(:grit_core_publication_status, :draft)
            )
          end

          let(:id) { draft_experiment.id }
          let(:params) { { name: "Updated Experiment Name" } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(draft_experiment.reload.name).to eq("Updated Experiment Name")
          end
        end
      end

      delete "Destroys a draft experiment" do
        tags "Assays - Experiments"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "experiment destroyed" do
          before { login_as(admin) }

          let(:id) do
            exp = Experiment.create!(
              name: "To Be Destroyed",
              assay_model: draft_model,
              publication_status: Grit::Core::PublicationStatus.find_or_create_by!(name: "Draft")
            )
            exp.id
          end

          run_test! do
            expect(Experiment.find_by(id: id)).to be_nil
          end
        end
      end
    end

    # --- Additional tests ---

    describe "additional behaviors" do
      before { login_as(admin) }

      it "newly created experiment has draft publication status" do
        post "/api/grit/assays/experiments", params: {
          name: "Draft Status Check Experiment",
          assay_model_id: draft_model.id
        }, as: :json

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        created = Experiment.find(json["data"]["id"])
        expect(created.publication_status.name).to eq("Draft")
      end

      it "creates experiment with metadata" do
        # Link species def to model
        AssayModelMetadatum.create!(assay_model: draft_model, assay_metadata_definition: species_def)

        expect {
          post "/api/grit/assays/experiments", params: {
            name: "Experiment With Metadata",
            assay_model_id: draft_model.id,
            species: vocab_item.id
          }, as: :json
        }.to change(Experiment, :count).by(1)
          .and change(ExperimentMetadatum, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true

        created = Experiment.find(json["data"]["id"])
        metadata = created.experiment_metadata.find_by(assay_metadata_definition: species_def)
        expect(metadata).not_to be_nil
        expect(metadata.vocabulary_item_id).to eq(vocab_item.id)
      end

      it "updates experiment metadata on update" do
        AssayModelMetadatum.create!(assay_model: draft_model, assay_metadata_definition: species_def)
        new_vocab_item = create(:grit_core_vocabulary_item, vocabulary: vocabulary)

        draft_experiment = Experiment.create!(
          name: "Draft Experiment",
          assay_model: draft_model,
          publication_status: create(:grit_core_publication_status, :draft)
        )

        patch "/api/grit/assays/experiments/#{draft_experiment.id}", params: {
          name: draft_experiment.name,
          species: new_vocab_item.id
        }, as: :json

        expect(response).to have_http_status(:success)
        draft_experiment.reload
        metadata = draft_experiment.experiment_metadata.find_by(assay_metadata_definition: species_def)
        expect(metadata).not_to be_nil
        expect(metadata.vocabulary_item_id).to eq(new_vocab_item.id)
      end
    end

    # --- Publish ---

    describe "publish" do
      before { login_as(admin) }

      it "publishes a draft experiment" do
        post "/api/grit/assays/experiments", params: {
          name: "To Be Published",
          assay_model_id: draft_model.id
        }, as: :json
        expect(response).to have_http_status(:created)
        experiment_id = JSON.parse(response.body)["data"]["id"]

        post "/api/grit/assays/experiments/#{experiment_id}/publish", as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(Experiment.find(experiment_id).publication_status.name).to eq("Published")
      end
    end

    # --- Draft (unpublish) ---

    describe "draft (unpublish)" do
      before { login_as(admin) }

      it "moves published experiment back to draft" do
        post "/api/grit/assays/experiments", params: {
          name: "To Be Drafted",
          assay_model_id: draft_model.id
        }, as: :json
        expect(response).to have_http_status(:created)
        experiment_id = JSON.parse(response.body)["data"]["id"]

        post "/api/grit/assays/experiments/#{experiment_id}/publish", as: :json
        expect(response).to have_http_status(:success)

        post "/api/grit/assays/experiments/#{experiment_id}/draft", as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(Experiment.find(experiment_id).publication_status.name).to eq("Draft")
      end
    end

    # --- Export ZIP ---

    describe "export" do
      before { login_as(admin) }

      it "returns a ZIP file containing a CSV for each data sheet" do
        post "/api/grit/assays/assay_models", params: {
          name: "Export Test Model",
          assay_type_id: biochemical.id,
          sheets: [
            {
              name: "Results",
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
        expect(response).to have_http_status(:created)
        model_id = JSON.parse(response.body)["data"]["id"]

        post "/api/grit/assays/assay_models/#{model_id}/publish", as: :json
        expect(response).to have_http_status(:success)

        post "/api/grit/assays/experiments", params: {
          name: "Export Test Experiment",
          assay_model_id: model_id
        }, as: :json
        expect(response).to have_http_status(:created)
        experiment_id = JSON.parse(response.body)["data"]["id"]

        get "/api/grit/assays/experiments/#{experiment_id}/export"

        expect(response).to have_http_status(:success)
        expect(response.content_type).to eq("application/zip")
        expect(response.headers["Content-Disposition"]).to include("Export Test Experiment.zip")

        zip_entries = []
        Tempfile.create([ "test_export", ".zip" ], binmode: true) do |f|
          f.write(response.body)
          f.rewind
          Zip::InputStream.open(f.path) do |zip|
            while (entry = zip.get_next_entry)
              zip_entries << entry.name
            end
          end
        end

        expect(zip_entries).to include("Export Test Experiment/data/Results.csv")

        # Clean up dynamic tables and experiments
        post "/api/grit/assays/assay_models/#{model_id}/draft", as: :json
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/experiments", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
