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
  RSpec.describe "Data Tables API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

    before do
      Grit::Core::UserSession.create(admin)
      RequestStore.store["current_user"] = admin
    end

    let(:vocab) { Grit::Core::Vocabulary.create!(name: "Test Species") }
    let(:data_type) { vocab.data_type }

    path "/api/grit/assays/data_tables" do
      get "Lists all data tables" do
        tags "Assays - Data Tables"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "data tables listed (requires auth)" do
          before { login_as(admin) }

          run_test!
        end
      end

      post "Creates a data table" do
        tags "Assays - Data Tables"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "201", "data table created with display columns callback" do
          before { login_as(admin) }

          let(:params) do
            { name: "Species Table", entity_data_type_id: data_type.id }
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true

            columns = DataTableColumn.where(data_table_id: json["data"]["id"])
            expect(columns.count).to eq(1)
            expect(columns.order(:id).first.safe_name).to eq("entity_name")
          end
        end
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/data_tables", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
