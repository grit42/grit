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

RSpec.describe "Roles API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:role) { Grit::Core::Role.find_by!(name: "Administrator") }

  before(:each) do
    login_as(admin)
  end

  it_behaves_like "a read-only entity",
    model_class: Grit::Core::Role,
    index_url: "/api/grit/core/roles",
    show_url: -> { "/api/grit/core/roles/#{role.id}" },
    create_params: { name: "Test", description: "Test role" },
    update_url: -> { "/api/grit/core/roles/#{role.id}" },
    update_params: { name: "Updated role" },
    destroy_url: -> { "/api/grit/core/roles/#{role.id}" }

  path "/api/grit/core/roles" do
    get "Lists all roles" do
      tags "Core - Roles"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "roles listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Attempts to create a role" do
      tags "Core - Roles"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :role_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          description: { type: :string }
        }
      }

      response "403", "creation is forbidden" do
        let(:role_params) { { name: "Test", description: "Test role" } }
        before { login_as(admin) }
        run_test!
      end
    end
  end

  path "/api/grit/core/roles/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a role" do
      tags "Core - Roles"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "role found" do
        let(:id) { role.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Attempts to update a role" do
      tags "Core - Roles"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :role_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "403", "update is forbidden" do
        let(:id) { role.id }
        let(:role_params) { { name: "Updated role" } }
        before { login_as(admin) }
        run_test!
      end
    end

    delete "Attempts to destroy a role" do
      tags "Core - Roles"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "403", "destruction is forbidden" do
        let(:id) { role.id }
        before { login_as(admin) }
        run_test!
      end
    end
  end
end
