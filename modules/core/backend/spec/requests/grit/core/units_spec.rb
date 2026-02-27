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

RSpec.describe "Units API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:notadmin) { create(:grit_core_user) }
  let!(:unit) { create(:grit_core_unit, :meter) }

  it_behaves_like "an admin-only CRUD entity",
    model_class: Grit::Core::Unit,
    admin_user: -> { admin },
    non_admin_user: -> { notadmin },
    index_url: "/api/grit/core/units",
    show_url: -> { "/api/grit/core/units/#{unit.id}" },
    create_params: { name: "test_new", abbreviation: "tn" },
    update_url: -> { "/api/grit/core/units/#{unit.id}" },
    update_params: { name: "meter_updated" },
    destroy_url: -> { "/api/grit/core/units/#{unit.id}" }

  path "/api/grit/core/units" do
    get "Lists all units" do
      tags "Core - Units"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "units listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Creates a unit" do
      tags "Core - Units"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :unit_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          abbreviation: { type: :string }
        }
      }

      response "201", "unit created" do
        let(:unit_params) { { name: "kilogram", abbreviation: "kg" } }
        before { login_as(admin) }
        run_test!
      end

      response "403", "forbidden for non-admin" do
        let(:unit_params) { { name: "kilogram", abbreviation: "kg" } }
        before { login_as(notadmin) }
        run_test!
      end
    end
  end

  path "/api/grit/core/units/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a unit" do
      tags "Core - Units"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "unit found" do
        let(:id) { unit.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Updates a unit" do
      tags "Core - Units"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :unit_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "200", "unit updated" do
        let(:id) { unit.id }
        let(:unit_params) { { name: "meter_updated" } }
        before { login_as(admin) }
        run_test!
      end

      response "403", "forbidden for non-admin" do
        let(:id) { unit.id }
        let(:unit_params) { { name: "meter_updated" } }
        before { login_as(notadmin) }
        run_test!
      end
    end

    delete "Destroys a unit" do
      tags "Core - Units"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "unit destroyed" do
        let(:id) { unit.id }
        before { login_as(admin) }
        run_test!
      end

      response "403", "forbidden for non-admin" do
        let(:id) { unit.id }
        before { login_as(notadmin) }
        run_test!
      end
    end
  end
end
