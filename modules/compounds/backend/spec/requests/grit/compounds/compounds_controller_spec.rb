# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/compounds.
#
# @grit42/compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.


require "swagger_helper"

RSpec.describe Grit::Compounds::CompoundsController, type: :request do
  include AuthHelpers

  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:origin) { create(:grit_core_origin) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:compound) { create(:grit_compounds_compound, origin: origin, compound_type: compound_type) }

  before do
    login_as(admin)
  end

  describe "GET /api/grit/compounds/compounds" do
    it "returns success" do
      get "/api/grit/compounds/compounds", as: :json
      expect(response).to have_http_status(:success)
    end

    it "returns one result when looking for synonym" do
      compound # trigger creation
      create(:grit_compounds_synonym, name: "wan", compound: compound)

      filter = ActiveSupport::JSON.encode([ { type: "string", operator: "eq", property: "name", value: "wan" } ])
      get "/api/grit/compounds/compounds", params: "filter=#{URI.encode_uri_component(filter)}"

      expect(response).to have_http_status(:success)
      res = JSON.parse(response.body)
      expect(res["data"].length).to eq(1)
      expect(res["data"][0]["name"]).to eq("wan")
    end
  end

  describe "POST /api/grit/compounds/compounds" do
    it "creates compound" do
      expect {
        post "/api/grit/compounds/compounds",
             params: { name: "four", number: "four", origin_id: origin.id, compound_type_id: compound_type.id },
             as: :json
      }.to change(Grit::Compounds::Compound, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe "GET /api/grit/compounds/compounds/:id" do
    it "shows compound" do
      get "/api/grit/compounds/compounds/#{compound.id}", as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "PATCH /api/grit/compounds/compounds/:id" do
    it "updates compound" do
      patch "/api/grit/compounds/compounds/#{compound.id}", params: { name: "ouane" }, as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "DELETE /api/grit/compounds/compounds/:id" do
    it "destroys compound" do
      compound # trigger creation
      expect {
        delete "/api/grit/compounds/compounds/#{compound.id}", as: :json
      }.to change(Grit::Compounds::Compound, :count).by(-1)

      expect(response).to have_http_status(:success)
    end
  end

  path "/api/grit/compounds/compounds" do
    get "Lists all compounds" do
      tags "Compounds - Compounds"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "compounds listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Creates a compound" do
      tags "Compounds - Compounds"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :params, in: :body, schema: { type: :object }

      response "201", "compound created" do
        let(:params) { { name: "four", number: "four", origin_id: origin.id, compound_type_id: compound_type.id } }
        before { login_as(admin) }
        run_test!
      end
    end
  end

  path "/api/grit/compounds/compounds/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a compound" do
      tags "Compounds - Compounds"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "compound found" do
        let(:id) { compound.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Updates a compound" do
      tags "Compounds - Compounds"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :params, in: :body, schema: { type: :object }

      response "200", "compound updated" do
        let(:id) { compound.id }
        let(:params) { { name: "ouane" } }
        before { login_as(admin) }
        run_test!
      end
    end

    delete "Destroys a compound" do
      tags "Compounds - Compounds"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "compound destroyed" do
        let(:id) { compound.id }
        before { login_as(admin) }
        run_test!
      end
    end
  end
end
