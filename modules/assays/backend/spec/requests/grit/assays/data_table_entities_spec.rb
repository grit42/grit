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
  RSpec.describe "Data Table Entities API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

    before do
      Grit::Core::UserSession.create(admin)
      RequestStore.store["current_user"] = admin
    end

    let(:vocab) { Grit::Core::Vocabulary.create!(name: "Test Species") }
    let(:data_type) { vocab.data_type }
    let(:item1) { Grit::Core::VocabularyItem.create!(name: "Mouse", vocabulary: vocab) }
    let(:item2) { Grit::Core::VocabularyItem.create!(name: "Rat", vocabulary: vocab) }
    let(:data_table) { DataTable.create!(name: "Test Table", entity_data_type: data_type) }

    path "/api/grit/assays/data_table_entities" do
      get "Lists all data table entities" do
        tags "Assays - Data Table Entities"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "data table entities listed (requires auth)" do
          before { login_as(admin) }

          run_test!
        end
      end
    end

    # --- Create Bulk ---

    describe "create_bulk" do
      before { login_as(admin) }

      it "adds multiple entities atomically" do
        expect {
          post "/api/grit/assays/data_table_entities/create_bulk",
            params: [
              { data_table_id: data_table.id, entity_id: item1.id },
              { data_table_id: data_table.id, entity_id: item2.id }
            ],
            as: :json
        }.to change(DataTableEntity, :count).by(2)

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json["success"]).to be true
      end
    end

    # --- Authentication ---

    describe "authentication" do
      it "requires authentication" do
        login_as(admin)
        logout
        get "/api/grit/assays/data_table_entities", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
