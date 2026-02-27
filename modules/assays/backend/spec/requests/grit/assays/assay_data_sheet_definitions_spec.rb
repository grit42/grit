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
  RSpec.describe "Assay Data Sheet Definitions API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }

    let(:draft_sheet) do
      AssayDataSheetDefinition.create!(
        name: "Results", assay_model: draft_model, result: true, sort: 1
      )
    end

    before do
      set_current_user(admin)
    end

    path "/api/grit/assays/assay_data_sheet_definitions" do
      get "Lists all assay data sheet definitions" do
        tags "Assays - Assay Data Sheet Definitions"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay data sheet definitions listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end
    end

    path "/api/grit/assays/assay_data_sheet_definitions/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an assay data sheet definition" do
        tags "Assays - Assay Data Sheet Definitions"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay data sheet definition shown" do
          let(:id) { draft_sheet.id }
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["id"]).to eq(draft_sheet.id)
          end
        end
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/assay_data_sheet_definitions", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    # Note: Full CRUD testing for AssayDataSheetDefinitions is complex due to
    # publication status constraints. Sheet definitions are typically created
    # as part of assay model creation via the assay_models_controller.
  end
end
