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
  RSpec.describe "Assay Types API", type: :request do
    let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
    let(:assay_type) { create(:grit_assays_assay_type, :biochemical) }

    before do
      Grit::Core::UserSession.create(admin)
    end

    path "/api/grit/assays/assay_types" do
      get "Lists all assay types" do
        tags "Assays - Assay Types"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay types listed" do
          before do
            login_as(admin)
            assay_type
          end

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]).to be_a(Array)
          end
        end
      end

      post "Creates an assay type" do
        tags "Assays - Assay Types"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "201", "assay type created" do
          before { login_as(admin) }

          let(:params) { { name: "New Assay Type", description: "A new assay type" } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["name"]).to eq("New Assay Type")
          end
        end

        response "422", "assay type not created without name" do
          before { login_as(admin) }

          let(:params) { { description: "Missing name" } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be false
          end
        end
      end
    end

    path "/api/grit/assays/assay_types/{id}" do
      parameter name: :id, in: :path, type: :integer

      get "Shows an assay type" do
        tags "Assays - Assay Types"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay type shown" do
          let(:id) { assay_type.id }
          before { login_as(admin) }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(json["data"]["id"]).to eq(assay_type.id)
          end
        end
      end

      patch "Updates an assay type" do
        tags "Assays - Assay Types"
        consumes "application/json"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay type updated" do
          let(:id) { assay_type.id }
          before { login_as(admin) }

          let(:params) { { name: "Updated Name" } }

          run_test! do |response|
            json = JSON.parse(response.body)
            expect(json["success"]).to be true
            expect(assay_type.reload.name).to eq("Updated Name")
          end
        end
      end

      delete "Destroys an assay type" do
        tags "Assays - Assay Types"
        produces "application/json"
        security [ { cookie_auth: [] } ]

        response "200", "assay type destroyed" do
          before { login_as(admin) }

          let(:id) do
            post "/api/grit/assays/assay_types",
              params: { name: "To Delete", description: "Will be deleted" },
              as: :json
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
        get "/api/grit/assays/assay_types", as: :json
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end
