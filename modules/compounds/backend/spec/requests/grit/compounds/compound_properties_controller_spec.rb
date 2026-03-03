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

RSpec.describe Grit::Compounds::CompoundPropertiesController, type: :request do
  include AuthHelpers

  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:data_type) { create(:grit_core_data_type, :string) }
  let(:compound_property) do
    create(:grit_compounds_compound_property,
           compound_type: compound_type,
           data_type: data_type)
  end

  before do
    login_as(admin)
  end

  describe "GET /api/grit/compounds/compound_properties" do
    it "returns success" do
      get "/api/grit/compounds/compound_properties"
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /api/grit/compounds/compound_properties" do
    it "creates compound_property" do
      integer_type = create(:grit_core_data_type, :integer)
      expect {
        post "/api/grit/compounds/compound_properties",
             params: {
               name: "Three", safe_name: "three",
               compound_type_id: compound_type.id, data_type_id: integer_type.id,
               sort: 0, required: false
             },
             as: :json
      }.to change(Grit::Compounds::CompoundProperty, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe "GET /api/grit/compounds/compound_properties/:id" do
    it "shows compound_property" do
      get "/api/grit/compounds/compound_properties/#{compound_property.id}", as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "PATCH /api/grit/compounds/compound_properties/:id" do
    it "updates compound_property" do
      patch "/api/grit/compounds/compound_properties/#{compound_property.id}",
            params: { name: "wan" }, as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "DELETE /api/grit/compounds/compound_properties/:id" do
    it "does not destroy compound_property with value" do
      compound = create(:grit_compounds_compound, compound_type: compound_type)
      create(:grit_compounds_compound_property_value,
             compound_property: compound_property,
             compound: compound)

      expect {
        delete "/api/grit/compounds/compound_properties/#{compound_property.id}", as: :json
      }.not_to change(Grit::Compounds::CompoundProperty, :count)

      expect(response).to have_http_status(:internal_server_error)
    end
  end

  path "/api/grit/compounds/compound_properties" do
    get "Lists all compound properties" do
      tags "Compounds - Compound Properties"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "compound properties listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Creates a compound property" do
      tags "Compounds - Compound Properties"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :params, in: :body, schema: { type: :object }

      response "201", "compound property created" do
        let(:integer_type) { create(:grit_core_data_type, :integer) }
        let(:params) { { name: "Three", safe_name: "three", compound_type_id: compound_type.id, data_type_id: integer_type.id, sort: 0, required: false } }
        before { login_as(admin) }
        run_test!
      end
    end
  end

  path "/api/grit/compounds/compound_properties/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a compound property" do
      tags "Compounds - Compound Properties"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "compound property found" do
        let(:id) { compound_property.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Updates a compound property" do
      tags "Compounds - Compound Properties"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :params, in: :body, schema: { type: :object }

      response "200", "compound property updated" do
        let(:id) { compound_property.id }
        let(:params) { { name: "wan" } }
        before { login_as(admin) }
        run_test!
      end
    end

    delete "Destroys a compound property" do
      tags "Compounds - Compound Properties"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "500", "cannot delete compound property with values" do
        let(:compound) { create(:grit_compounds_compound, compound_type: compound_type) }
        let(:id) { compound_property.id }
        before do
          create(:grit_compounds_compound_property_value,
                 compound_property: compound_property,
                 compound: compound)
          login_as(admin)
        end
        run_test!
      end
    end
  end
end
