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

RSpec.describe "Origins API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:notadmin) { create(:grit_core_user) }
  let!(:origin) { create(:grit_core_origin, name: "TEST_ORIGIN", domain: "Test domain", status: "Test status") }

  it_behaves_like "an admin-only CRUD entity",
    model_class: Grit::Core::Origin,
    admin_user: -> { admin },
    non_admin_user: -> { notadmin },
    index_url: "/api/grit/core/origins",
    show_url: -> { "/api/grit/core/origins/#{origin.id}" },
    create_params: { name: "TESTTEST", domain: "Testtest domain", status: "Testtest status" },
    update_url: -> { "/api/grit/core/origins/#{origin.id}" },
    update_params: { name: "TESTTESTTEST" },
    destroy_url: -> { "/api/grit/core/origins/#{origin.id}" }

  path "/api/grit/core/origins" do
    get "Lists all origins" do
      tags "Core - Origins"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "origins listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Creates an origin" do
      tags "Core - Origins"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :origin_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          domain: { type: :string },
          status: { type: :string }
        }
      }

      response "201", "origin created" do
        let(:origin_params) { { name: "NEW_ORIGIN", domain: "New domain", status: "New status" } }
        before { login_as(admin) }
        run_test!
      end

      response "403", "forbidden for non-admin" do
        let(:origin_params) { { name: "NEW_ORIGIN", domain: "New domain", status: "New status" } }
        before { login_as(notadmin) }
        run_test!
      end
    end
  end

  path "/api/grit/core/origins/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows an origin" do
      tags "Core - Origins"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "origin found" do
        let(:id) { origin.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Updates an origin" do
      tags "Core - Origins"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :origin_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "200", "origin updated" do
        let(:id) { origin.id }
        let(:origin_params) { { name: "TESTTESTTEST" } }
        before { login_as(admin) }
        run_test!
      end

      response "403", "forbidden for non-admin" do
        let(:id) { origin.id }
        let(:origin_params) { { name: "TESTTESTTEST" } }
        before { login_as(notadmin) }
        run_test!
      end
    end

    delete "Destroys an origin" do
      tags "Core - Origins"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "origin destroyed" do
        let(:id) { origin.id }
        before { login_as(admin) }
        run_test!
      end

      response "403", "forbidden for non-admin" do
        let(:id) { origin.id }
        before { login_as(notadmin) }
        run_test!
      end
    end
  end
end
