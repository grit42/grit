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
  RSpec.describe "Assay Data Sheet Columns API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:biochemical) { create(:grit_assays_assay_type, :biochemical) }
    let(:integer_type) { create(:grit_core_data_type, :integer) }
    let(:draft_model) { create(:grit_assays_assay_model, :draft, assay_type: biochemical) }
    let(:published_model) { create(:grit_assays_assay_model, :published, assay_type: biochemical) }

    let(:draft_sheet) do
      AssayDataSheetDefinition.create!(
        name: "Results", assay_model: draft_model, result: true, sort: 1
      )
    end

    let(:published_sheet) do
      AssayDataSheetDefinition.create!(
        name: "Published Results", assay_model: published_model, result: true, sort: 1
      )
    end

    let(:draft_column) do
      AssayDataSheetColumn.create!(
        name: "Concentration", safe_name: "concentration",
        assay_data_sheet_definition: draft_sheet, data_type: integer_type,
        sort: 1, required: false
      )
    end

    let(:published_column) do
      AssayDataSheetColumn.create!(
        name: "Viability", safe_name: "viability",
        assay_data_sheet_definition: published_sheet, data_type: integer_type,
        sort: 1, required: false
      )
    end

    before do
      set_current_user(admin)
    end

    path "/api/grit/assays/assay_data_sheet_columns" do
      get "Lists all assay data sheet columns" do
        tags "Assays - Assay Data Sheet Columns"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay data sheet columns listed" do
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Creates an assay data sheet column" do
        tags "Assays - Assay Data Sheet Columns"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "201", "column created on draft model" do
          before { login_as(admin) }

          let(:params) do
            {
              name: "New Column", safe_name: "new_column",
              description: "A new column",
              assay_data_sheet_definition_id: draft_sheet.id,
              data_type_id: integer_type.id,
              sort: 10, required: false
            }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["name"]).to eq("New Column")
          end
        end

        response "500", "cannot create column on published model" do
          before { login_as(admin) }

          let(:params) do
            {
              name: "New Column", safe_name: "new_column_pub",
              assay_data_sheet_definition_id: published_sheet.id,
              data_type_id: integer_type.id,
              sort: 10, required: false
            }
          end

          run_test!
        end

        response "422", "cannot create column with invalid safe_name" do
          before { login_as(admin) }

          let(:params) do
            {
              name: "Bad Column", safe_name: "1_invalid",
              assay_data_sheet_definition_id: draft_sheet.id,
              data_type_id: integer_type.id,
              sort: 10, required: false
            }
          end

          run_test!
        end
      end
    end

    path "/api/grit/assays/assay_data_sheet_columns/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an assay data sheet column" do
        tags "Assays - Assay Data Sheet Columns"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay data sheet column shown" do
          let(:id) { draft_column.id }
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["id"]).to eq(draft_column.id)
          end
        end
      end

      patch "Updates an assay data sheet column" do
        tags "Assays - Assay Data Sheet Columns"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "column updated on draft model" do
          let(:id) { draft_column.id }
          before { login_as(admin) }

          let(:params) { { description: "Updated description" } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(draft_column.reload.description).to eq("Updated description")
          end
        end

        response "500", "cannot update column on published model" do
          let(:id) { published_column.id }
          before { login_as(admin) }

          let(:params) { { description: "Cannot update" } }

          run_test!
        end
      end

      delete "Destroys an assay data sheet column on draft model" do
        tags "Assays - Assay Data Sheet Columns"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "column destroyed" do
          before { login_as(admin) }

          let(:id) do
            post "/api/grit/assays/assay_data_sheet_columns", params: {
              name: "To Delete", safe_name: "to_delete_col",
              assay_data_sheet_definition_id: draft_sheet.id,
              data_type_id: integer_type.id,
              sort: 99, required: false
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
        get "/api/grit/assays/assay_data_sheet_columns", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
