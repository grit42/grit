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


require "openapi_helper"

RSpec.describe "Countries API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:country) { create(:grit_core_country, :test) }

  before(:each) do
    login_as(admin)
  end

  it_behaves_like "a read-only entity",
    model_class: Grit::Core::Country,
    index_url: "/api/grit/core/countries",
    show_url: -> { "/api/grit/core/countries/#{country.id}" },
    create_params: { name: "Yop", iso: "YP" },
    update_url: -> { "/api/grit/core/countries/#{country.id}" },
    update_params: { name: "Testtest" },
    destroy_url: -> { "/api/grit/core/countries/#{country.id}" }

  path "/api/grit/core/countries" do
    get "Lists all countries" do
      tags "Core - Countries"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "countries listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Attempts to create a country" do
      tags "Core - Countries"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :country_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          iso: { type: :string }
        }
      }

      response "403", "creation is forbidden" do
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
      security [ { cookie_auth: [] } ]

      response "200", "country found" do
        let(:id) { country.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Attempts to update a country" do
      tags "Core - Countries"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :country_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "403", "update is forbidden" do
        let(:id) { country.id }
        let(:country_params) { { name: "Testtest" } }
        before { login_as(admin) }
        run_test!
      end
    end

    delete "Attempts to destroy a country" do
      tags "Core - Countries"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "403", "destruction is forbidden" do
        let(:id) { country.id }
        before { login_as(admin) }
        run_test!
      end
    end
  end
end
