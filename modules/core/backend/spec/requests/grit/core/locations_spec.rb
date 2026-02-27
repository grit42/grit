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

RSpec.describe "Locations API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:notadmin) { create(:grit_core_user) }
  let(:country) { create(:grit_core_country) }
  let(:origin) { create(:grit_core_origin) }
  let!(:location) { create(:grit_core_location, country: country, origin: origin) }

  it_behaves_like "an admin-only CRUD entity",
    model_class: Grit::Core::Location,
    admin_user: -> { admin },
    non_admin_user: -> { notadmin },
    index_url: "/api/grit/core/locations",
    show_url: -> { "/api/grit/core/locations/#{location.id}" },
    create_params: -> {
      {
        name: "Test location",
        print_address: "42, somestreet, 4242 Someplace, Somecountry",
        country_id: country.id,
        origin_id: origin.id
      }
    },
    update_url: -> { "/api/grit/core/locations/#{location.id}" },
    update_params: { name: "Another name for this test location" },
    destroy_url: -> { "/api/grit/core/locations/#{location.id}" }

  path "/api/grit/core/locations" do
    get "Lists all locations" do
      tags "Core - Locations"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "locations listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Creates a location" do
      tags "Core - Locations"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :location_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          print_address: { type: :string },
          country_id: { type: :integer },
          origin_id: { type: :integer }
        }
      }

      response "201", "location created" do
        let(:location_params) do
          {
            name: "New Test Location",
            print_address: "42, somestreet, 4242 Someplace",
            country_id: country.id,
            origin_id: origin.id
          }
        end
        before { login_as(admin) }
        run_test!
      end

      response "403", "forbidden for non-admin" do
        let(:location_params) do
          {
            name: "New Test Location",
            print_address: "42, somestreet, 4242 Someplace",
            country_id: country.id,
            origin_id: origin.id
          }
        end
        before { login_as(notadmin) }
        run_test!
      end
    end
  end

  path "/api/grit/core/locations/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a location" do
      tags "Core - Locations"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "location found" do
        let(:id) { location.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Updates a location" do
      tags "Core - Locations"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :location_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "200", "location updated" do
        let(:id) { location.id }
        let(:location_params) { { name: "Another name for this test location" } }
        before { login_as(admin) }
        run_test!
      end

      response "403", "forbidden for non-admin" do
        let(:id) { location.id }
        let(:location_params) { { name: "Another name for this test location" } }
        before { login_as(notadmin) }
        run_test!
      end
    end

    delete "Destroys a location" do
      tags "Core - Locations"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "location destroyed" do
        let(:id) { location.id }
        before { login_as(admin) }
        run_test!
      end

      response "403", "forbidden for non-admin" do
        let(:id) { location.id }
        before { login_as(notadmin) }
        run_test!
      end
    end
  end
end
