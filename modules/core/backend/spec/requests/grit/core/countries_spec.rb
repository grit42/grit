# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.


require "swagger_helper"

RSpec.describe "Countries API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:notadmin) { create(:grit_core_user, :with_read_role) }
  let!(:country) { create(:grit_core_country, :test) }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/countries" do
    get "Lists all countries" do
      tags "Core - Countries"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "countries listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Create a country" do
      tags "Core - Countries"
      consumes "application/json"
      produces "application/json"
      security [ { bearer_auth: [] } ]
      parameter name: :country_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          iso: { type: :string }
        }
      }

      response "201", "country created" do
        let(:country_params) { { name: "Yop", iso: "YP" } }
        before { login_as(admin) }
        run_test!
      end
    end
  end

  path "/api/grit/core/countries/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a country" do
      tags "Core - Countries"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "country found" do
        let(:id) { country.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Update a country" do
      tags "Core - Countries"
      consumes "application/json"
      produces "application/json"
      security [ { bearer_auth: [] } ]
      parameter name: :country_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "200", "country updated" do
        let(:id) { country.id }
        let(:country_params) { { name: "Testtest" } }
        before { login_as(admin) }
        run_test!
      end
    end

    delete "Delete a country" do
      tags "Core - Countries"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "country is deleted" do
        let(:id) { country.id }
        before { login_as(admin) }
        run_test!
      end
    end
  end

  it "allows index with 'read:system'" do
    login_as(notadmin)
    get "/api/grit/core/countries", as: :json
    expect(response).to have_http_status(:success)
  end

  it "allows show with 'read:system'" do
    login_as(notadmin)
    get "/api/grit/core/countries/#{country.id}", as: :json
    expect(response).to have_http_status(:success)
  end

  it "allows create with 'admin:system'" do
    expect {
      post "/api/grit/core/countries", params: { name: "Test1", iso: "YP" }, as: :json
  }.to change(Grit::Core::Country, :count)
    expect(response).to have_http_status(:created)
  end

  it "allows update with 'admin:system'" do
    patch "/api/grit/core/countries/#{country.id}", params: { name: "Testtest1" }, as: :json
    expect(response).to have_http_status(:success)
  end

  it "allows destroy with 'admin:system'" do
    expect {
      delete "/api/grit/core/countries/#{country.id}", as: :json
  }.to change(Grit::Core::Country, :count)
    expect(response).to have_http_status(:success)
  end

  it "forbids create without 'admin:system'" do
    login_as(notadmin)
    expect {
      post "/api/grit/core/countries", params: { name: "Test2", iso: "TT" }, as: :json
    }.not_to change(Grit::Core::Country, :count)
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids update without 'admin:system'" do
    login_as(notadmin)
    patch "/api/grit/core/countries/#{country.id}", params: { name: "Testtest2" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids destroy without 'admin:system'" do
    login_as(notadmin)
    expect {
      delete "/api/grit/core/countries/#{country.id}", as: :json
    }.not_to change(Grit::Core::Country, :count)
    expect(response).to have_http_status(:forbidden)
  end
end
