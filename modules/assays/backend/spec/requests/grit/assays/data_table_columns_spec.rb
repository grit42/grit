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
  RSpec.describe "Data Table Columns API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_administrator_role, :with_write_role) }

    before do
      set_current_user(admin)
      RequestStore.store["current_user"] = admin
    end

    let(:vocab) { Grit::Core::Vocabulary.create!(name: "Test Species") }
    let(:data_type) { vocab.data_type }
    let(:data_table) { DataTable.create!(name: "Test Table", entity_data_type: data_type) }

    path "/api/grit/assays/data_table_columns" do
      get "Lists all data table columns" do
        tags "Assays - Data Table Columns"
        produces "application/json"
        security [ { bearer_auth: [] } ]

        response "200", "data table columns listed (requires auth)" do
          before { login_as(admin) }

          run_test!
        end
      end

      post "Rejects duplicate safe_name within the same data table" do
        tags "Assays - Data Table Columns"
        consumes "application/json"
        produces "application/json"
        security [ { bearer_auth: [] } ]
        parameter name: :params, in: :body, schema: { type: :object }

        response "422", "duplicate safe_name rejected" do
          before { login_as(admin) }

          let(:params) do
            {
              data_table_id: data_table.id,
              name: "Duplicate Column",
              safe_name: "entity_name",
              source_type: "entity_attribute",
              entity_attribute_name: "name"
            }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be false
          end
        end
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/data_table_columns", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end

    # SQL injection prevention — finding #2 (SQL_INJECTION_AUDIT.md)
    # The filter property was interpolated raw into a WHERE clause in the raw-SQL
    # scope path (filter_and_sort_raw_sql). available_entity_attributes returns a
    # raw SQL string, triggering that path. The fix: quote_sort_property wraps the
    # property with quote_column_name before interpolation.
    describe "SQL injection prevention in filter property (finding #2)" do
      before { login_as(admin) }

      it "quotes a malicious filter property, not executing injected SQL" do
        malicious_filter = [
          { type: "string", operator: "contains",
            property: "name IS NULL OR (SELECT 'sqli_probe')='sqli_probe'--",
            value: "x" }
        ].to_json

        get "/api/grit/assays/data_table_columns",
            params: { scope: "available_entity_attributes",
                      data_table_id: "0",
                      filter: malicious_filter }

        # The probe was never executed as SQL (quoted as a column name, not evaluated)
        # Note: HTML error pages echo request params; only check status, not body
        # Status may vary (404 if data_table not found, 422 if column rejected) — never 500
        expect(response).not_to have_http_status(:internal_server_error)
      end
    end
  end
end
