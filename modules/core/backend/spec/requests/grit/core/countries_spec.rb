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
require "csv"

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

  # Security finding B: scope dispatch rejects inherited ActiveRecord methods.
  describe "scope dispatch security" do
    it "accepts the default scope (no param)" do
      get "/api/grit/core/countries"
      expect(response).to have_http_status(:ok)
    end

    it "accepts the explicit 'detailed' scope" do
      get "/api/grit/core/countries", params: { scope: "detailed" }
      expect(response).to have_http_status(:ok)
    end

    it "rejects the inherited 'update_all' scope" do
      get "/api/grit/core/countries", params: { scope: "update_all" }
      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)["errors"]).to include("update_all")
    end

    it "rejects the inherited 'delete_all' scope" do
      get "/api/grit/core/countries", params: { scope: "delete_all" }
      expect(response).to have_http_status(:bad_request)
    end

    it "rejects the inherited 'column_names' scope" do
      get "/api/grit/core/countries", params: { scope: "column_names" }
      expect(response).to have_http_status(:bad_request)
    end

    it "rejects a non-existent scope" do
      get "/api/grit/core/countries", params: { scope: "nonexistent_scope" }
      expect(response).to have_http_status(:bad_request)
    end
  end

  # SQL injection prevention — finding #1 (sort direction whitelist, SQL_INJECTION_AUDIT.md)
  describe "sort direction SQL injection prevention" do
    it "sanitizes a malicious sort direction to ASC, never executing injected SQL" do
      get "/api/grit/core/countries",
          params: { sort: [ { property: "name", direction: "ASC; SELECT 'sqli_probe';--" } ].to_json }
      expect(response).to have_http_status(:ok)
      expect(response.body).not_to include("sqli_probe")
    end
  end

  # SQL injection prevention — PR #97 (export column quoting)
  describe "CSV export column SQL injection prevention" do
    it "rejects a malicious column name, not executing it as SQL" do
      get "/api/grit/core/countries/export",
          params: { columns: [ "name", "(SELECT 'sqli_probe')" ] }
      # Quoted column is rejected by PG as an unknown identifier — NOT a successful export
      expect(response).not_to have_http_status(:ok)
    end

    it "exports normally with legitimate columns" do
      get "/api/grit/core/countries/export", params: { columns: [ "name", "iso" ] }
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/csv")
    end
  end

  # Security finding C: CSV export neutralizes formula-injection cell values.
  describe "CSV export formula injection" do
    let!(:normal)       { create(:grit_core_country, name: "Denmark",             iso: "DK") }
    let!(:eq_formula)   { create(:grit_core_country, name: "=CMD|'/c calc'!A1",  iso: "ZZ") }
    let!(:plus_formula) { create(:grit_core_country, name: "+1+1",               iso: "YY") }
    let!(:at_formula)   { create(:grit_core_country, name: "@SUM(1,2)",          iso: "XX") }

    before { get "/api/grit/core/countries/export" }

    it "returns a CSV response" do
      expect(response).to have_http_status(:ok)
      expect(response.content_type).to include("text/csv")
    end

    it "leaves normal values unchanged" do
      rows = CSV.parse(response.body, headers: true)
      dk_row = rows.find { |r| r["Iso"] == "DK" }
      expect(dk_row["Name"]).to eq("Denmark")
    end

    it "prepends ' to values starting with =" do
      rows = CSV.parse(response.body, headers: true)
      zz_row = rows.find { |r| r["Iso"] == "ZZ" }
      expect(zz_row["Name"]).to start_with("'=")
    end

    it "prepends ' to values starting with +" do
      rows = CSV.parse(response.body, headers: true)
      yy_row = rows.find { |r| r["Iso"] == "YY" }
      expect(yy_row["Name"]).to start_with("'+")
    end

    it "prepends ' to values starting with @" do
      rows = CSV.parse(response.body, headers: true)
      xx_row = rows.find { |r| r["Iso"] == "XX" }
      expect(xx_row["Name"]).to start_with("'@")
    end

    it "contains no unescaped leading formula triggers in data rows" do
      data_rows = response.body.lines.drop(1)
      data_rows.each do |line|
        expect(line).not_to match(/\A[=+\-@]/)
      end
    end
  end
end
