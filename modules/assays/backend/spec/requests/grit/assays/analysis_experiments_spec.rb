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


require "swagger_helper"

module Grit::Assays
  RSpec.describe "AnalysisExperiments API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }
    let(:sheet_def) { create(:grit_assays_assay_data_sheet_definition, assay_model: draft_model) }
    let(:analysis) { create(:grit_assays_analysis, assay_data_sheet_definition: sheet_def) }
    let(:published_status) { create(:grit_core_publication_status, :published) }

    let(:published_experiment) do
      Experiment.create!(
        name: "Published Exp",
        assay_model: draft_model,
        publication_status: published_status
      )
    end

    before do
      set_current_user(admin)
    end

    # --- Nested routes ---

    path "/api/grit/assays/analyses/{analysis_id}/analysis_experiments" do
      parameter name: :analysis_id, in: :path, type: :integer

      get "Lists analysis experiments for an analysis" do
        tags "Assays - Analysis Experiments"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "analysis experiments listed" do
          before do
            login_as(admin)
            AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
          end

          let(:analysis_id) { analysis.id }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Adds an experiment to an analysis" do
        tags "Assays - Analysis Experiments"
        consumes "application/json"
        produces "application/json"
        security [ { bearer_auth: [] } ]
        parameter name: :params, in: :body, schema: { type: :object }

        response "201", "experiment added to analysis" do
          before { login_as(admin) }

          let(:analysis_id) { analysis.id }
          let(:params) { { experiment_id: published_experiment.id } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(AnalysisExperiment.where(analysis: analysis, experiment: published_experiment)).to exist
          end
        end

        response "422", "duplicate experiment not added" do
          before do
            login_as(admin)
            AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
          end

          let(:analysis_id) { analysis.id }
          let(:params) { { experiment_id: published_experiment.id } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be false
          end
        end
      end
    end

    path "/api/grit/assays/analyses/{analysis_id}/analysis_experiments/{id}" do
      parameter name: :analysis_id, in: :path, type: :integer
      parameter name: :id, in: :path, type: :integer

      delete "Removes an experiment from an analysis" do
        tags "Assays - Analysis Experiments"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "experiment removed from analysis" do
          before { login_as(admin) }

          let(:analysis_id) { analysis.id }
          let(:id) do
            AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment).id
          end

          run_test! do
            expect(AnalysisExperiment.find_by(id: id)).to be_nil
          end
        end
      end
    end

    # --- Additional behaviors ---

    describe "selected_experiments scope" do
      before { login_as(admin) }

      it "returns experiments linked to the analysis with experiment_analysis_id" do
        ae = AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)

        get "/api/grit/assays/analyses/#{analysis.id}/analysis_experiments",
          params: { scope: "selected_experiments", analysis_id: analysis.id }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        ids = json["data"].map { |r| r["id"] }
        expect(ids).to include(published_experiment.id)
        expect(json["data"].first).to have_key("experiment_analysis_id")
      end
    end

    describe "available_experiments scope" do
      before { login_as(admin) }

      it "returns published experiments not yet linked to the analysis" do
        published_experiment # ensure created before querying

        get "/api/grit/assays/analyses/#{analysis.id}/analysis_experiments",
          params: { scope: "available_experiments", analysis_id: analysis.id }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        ids = json["data"].map { |r| r["id"] }
        expect(ids).to include(published_experiment.id)
      end

      it "excludes experiments already linked to the analysis" do
        AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)

        get "/api/grit/assays/analyses/#{analysis.id}/analysis_experiments",
          params: { scope: "available_experiments", analysis_id: analysis.id }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        ids = json["data"].map { |r| r["id"] }
        expect(ids).not_to include(published_experiment.id)
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        AnalysisExperiment.create!(analysis: analysis, experiment: published_experiment)
        logout
        get "/api/grit/assays/analyses/#{analysis.id}/analysis_experiments"
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
