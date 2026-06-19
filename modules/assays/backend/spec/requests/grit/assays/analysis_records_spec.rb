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
  RSpec.describe "Analysis Records API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }
    let!(:draft_status) { Grit::Core::PublicationStatus.find_or_create_by!(name: "Draft") }
    let!(:published_status) { Grit::Core::PublicationStatus.find_or_create_by!(name: "Published") }

    let(:model) do
      AssayModel.create!(
        name: "Analysis Record Test Model",
        assay_type: biochemical,
        publication_status: draft_status
      )
    end

    let(:sheet) do
      s = AssayDataSheetDefinition.create!(
        name: "Analysis Record Test Sheet",
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

    let(:analysis) { Analysis.create!(name: "Test Analysis", assay_data_sheet_definition: sheet) }

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
      model.destroy rescue nil
    end

    def create_record_for(experiment, value:)
      post "/api/grit/assays/assay_data_sheet_definitions/#{sheet.id}/experiment_data_sheet_records",
        params: {
          experiment_id: experiment.id,
          assay_data_sheet_definition_id: sheet.id,
          value: value
        },
        as: :json
      expect(response).to have_http_status(:created)
      JSON.parse(response.body)["data"]["id"]
    end

    # --- rswag path ---

    path "/api/grit/assays/analyses/{analysis_id}/analysis_records" do
      parameter name: :analysis_id, in: :path, type: :integer

      get "Lists analysis records" do
        tags "Assays - Analysis Records"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "analysis records listed" do
          before do
            login_as(admin)
            # Materialize all model-level records while RequestStore["current_user"]
            # is still set; the first HTTP POST below clears it via middleware.
            klass
            analysis
            exp = Experiment.create!(name: "Rswag Exp", assay_model: model, publication_status: draft_status)
            create_record_for(exp, value: 1)
            exp.update_column(:publication_status_id, published_status.id)
          end

          let(:analysis_id) { analysis.id }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end
    end

    # --- Additional behaviors ---

    describe "without linked experiments" do
      before { login_as(admin) }

      it "returns all published records for the data sheet" do
        # Create all model-level records before the first HTTP POST, which
        # clears RequestStore["current_user"] via middleware.
        klass
        analysis
        exp1 = Experiment.create!(name: "Exp 1", assay_model: model, publication_status: draft_status)
        exp2 = Experiment.create!(name: "Exp 2", assay_model: model, publication_status: draft_status)
        create_record_for(exp1, value: 10)
        create_record_for(exp2, value: 20)
        exp1.update_column(:publication_status_id, published_status.id)
        exp2.update_column(:publication_status_id, published_status.id)

        get "/api/grit/assays/analyses/#{analysis.id}/analysis_records",
          params: { scope: "for_analysis" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        expect(json["data"].length).to eq(2)
      end
    end

    describe "with linked experiments" do
      before { login_as(admin) }

      it "returns only records from experiments linked to the analysis" do
        # Create all model-level records (including the link) before the first
        # HTTP POST, which clears RequestStore["current_user"] via middleware.
        klass
        analysis
        exp1 = Experiment.create!(name: "Linked Exp", assay_model: model, publication_status: draft_status)
        exp2 = Experiment.create!(name: "Unlinked Exp", assay_model: model, publication_status: draft_status)
        AnalysisExperiment.create!(analysis: analysis, experiment: exp1)
        create_record_for(exp1, value: 11)
        create_record_for(exp2, value: 22)
        exp1.update_column(:publication_status_id, published_status.id)
        exp2.update_column(:publication_status_id, published_status.id)

        get "/api/grit/assays/analyses/#{analysis.id}/analysis_records",
          params: { scope: "for_analysis" }

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
        values = json["data"].map { |r| r["value"] }
        expect(values).to include(11)
        expect(values).not_to include(22)
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/analyses/#{analysis.id}/analysis_records", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
