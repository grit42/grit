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
  RSpec.describe "Analyses API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
    let(:sheet_def) { create(:grit_assays_assay_data_sheet_definition) }

    before do
      set_current_user(admin)
    end

    path "/api/grit/assays/analyses" do
      get "Lists all analyses" do
        tags "Assays - Analyses"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "analyses listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Creates an analysis" do
        tags "Assays - Analyses"
        consumes "application/json"
        produces "application/json"
        security [ { bearer_auth: [] } ]
        parameter name: :params, in: :body, schema: { type: :object }

        response "201", "analysis created" do
          before { login_as(admin) }

          let(:params) do
            { name: "New Analysis", assay_data_sheet_definition_id: sheet_def.id }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["name"]).to eq("New Analysis")
          end
        end

        response "422", "analysis not created without name" do
          before { login_as(admin) }

          let(:params) { { assay_data_sheet_definition_id: sheet_def.id } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be false
          end
        end
      end
    end

    path "/api/grit/assays/analyses/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an analysis" do
        tags "Assays - Analyses"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "analysis shown" do
          before { login_as(admin) }

          let(:id) { create(:grit_assays_analysis, assay_data_sheet_definition: sheet_def).id }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to have_key("name")
          end
        end
      end

      patch "Updates an analysis" do
        tags "Assays - Analyses"
        consumes "application/json"
        produces "application/json"
        security [ { bearer_auth: [] } ]
        parameter name: :params, in: :body, schema: { type: :object }

        response "200", "analysis updated" do
          before { login_as(admin) }

          let(:analysis) { create(:grit_assays_analysis, assay_data_sheet_definition: sheet_def) }
          let(:id) { analysis.id }
          let(:params) { { name: "Updated Analysis Name" } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(analysis.reload.name).to eq("Updated Analysis Name")
          end
        end
      end

      delete "Destroys an analysis" do
        tags "Assays - Analyses"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "analysis destroyed" do
          before { login_as(admin) }

          let(:id) { create(:grit_assays_analysis, assay_data_sheet_definition: sheet_def).id }

          run_test! do
            expect(Analysis.find_by(id: id)).to be_nil
          end
        end
      end
    end

    # --- Additional behaviors ---

    describe "additional behaviors" do
      before { login_as(admin) }

      it "accepts and persists filters and plots" do
        filters = { "operator" => "and", "conditions" => [] }
        plots = { "type" => "scatter" }

        post "/api/grit/assays/analyses", params: {
          name: "Analysis With Filters",
          assay_data_sheet_definition_id: sheet_def.id,
          filters: filters,
          plots: plots
        }, as: :json

        expect(response).to have_http_status(:created)
        created = Analysis.find(JSON.parse(response.body)["data"]["id"])
        expect(created.filters).to eq(filters)
        expect(created.plots).to eq(plots)
      end

      it "includes filters and plots in the persisted record" do
        filters = { "operator" => "and", "conditions" => [] }
        plots = { "type" => "scatter" }
        analysis = create(:grit_assays_analysis, assay_data_sheet_definition: sheet_def, filters: filters, plots: plots)
        get "/api/grit/assays/analyses/#{analysis.id}", as: :json
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["data"]).to have_key("filters")
        expect(json["data"]).to have_key("plots")
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/analyses", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
