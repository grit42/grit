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

RSpec.describe Grit::Compounds::CompoundTypesController, type: :request do
  include AuthHelpers

  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:reagent_type) { create(:grit_compounds_compound_type, :reagent) }

  before do
    login_as(admin)
  end

  describe "GET /api/grit/compounds/compound_types" do
    it "returns success" do
      get "/api/grit/compounds/compound_types"
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /api/grit/compounds/compound_types" do
    it "creates compound_type" do
      expect {
        post "/api/grit/compounds/compound_types", params: { name: "test type" }, as: :json
      }.to change(Grit::Compounds::CompoundType, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe "GET /api/grit/compounds/compound_types/:id" do
    it "shows compound_type" do
      get "/api/grit/compounds/compound_types/#{compound_type.id}", as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "PATCH /api/grit/compounds/compound_types/:id" do
    it "updates compound_type" do
      patch "/api/grit/compounds/compound_types/#{compound_type.id}", params: { name: "Screaning" }, as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "DELETE /api/grit/compounds/compound_types/:id" do
    it "destroys compound_type without compounds" do
      reagent_type # trigger creation
      expect {
        delete "/api/grit/compounds/compound_types/#{reagent_type.id}", as: :json
      }.to change(Grit::Compounds::CompoundType, :count).by(-1)

      expect(response).to have_http_status(:success)
    end

    it "does not destroy compound_type with compounds" do
      # Create a compound using this type so it cannot be deleted
      create(:grit_compounds_compound, compound_type: compound_type)

      expect {
        delete "/api/grit/compounds/compound_types/#{compound_type.id}", as: :json
      }.not_to change(Grit::Compounds::CompoundType, :count)

      expect(response).to have_http_status(:internal_server_error)
    end
  end

  path "/api/grit/compounds/compound_types" do
    get "Lists all compound types" do
      tags "Compounds - Compound Types"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "compound types listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Creates a compound type" do
      tags "Compounds - Compound Types"
      consumes "application/json"
      produces "application/json"
      security [ { bearer_auth: [] } ]
      parameter name: :params, in: :body, schema: { type: :object }

      response "201", "compound type created" do
        let(:params) { { name: "test type" } }
        before { login_as(admin) }
        run_test!
      end
    end
  end

  path "/api/grit/compounds/compound_types/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a compound type" do
      tags "Compounds - Compound Types"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "compound type found" do
        let(:id) { compound_type.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Updates a compound type" do
      tags "Compounds - Compound Types"
      consumes "application/json"
      produces "application/json"
      security [ { bearer_auth: [] } ]
      parameter name: :params, in: :body, schema: { type: :object }

      response "200", "compound type updated" do
        let(:id) { compound_type.id }
        let(:params) { { name: "Screaning" } }
        before { login_as(admin) }
        run_test!
      end
    end

    delete "Destroys a compound type" do
      tags "Compounds - Compound Types"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "compound type destroyed" do
        let(:id) { reagent_type.id }
        before { login_as(admin) }
        run_test!
      end
    end
  end
end
