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

RSpec.describe "User Roles API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:admin_role) { Grit::Core::Role.find_by!(name: "Administrator") }
  let(:user_role) { Grit::Core::UserRole.find_by!(user: admin, role: admin_role) }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/user_roles" do
    get "Attempts to list user roles" do
      tags "Core - User Roles"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "403", "listing is forbidden" do
        run_test!
      end
    end

    post "Attempts to create a user role" do
      tags "Core - User Roles"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :user_role_params, in: :body, schema: {
        type: :object,
        properties: {
          user_id: { type: :integer },
          role_id: { type: :integer }
        }
      }

      response "403", "creation is forbidden" do
        let(:user_role_params) { { user_id: 1, role_id: 43 } }

        it "does not change the count" do
          expect {
            post "/api/grit/core/user_roles", params: { user_id: 1, role_id: 43 }, as: :json
          }.not_to change(Grit::Core::UserRole, :count)
        end

        run_test!
      end
    end
  end

  path "/api/grit/core/user_roles/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Attempts to show a user role" do
      tags "Core - User Roles"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "403", "showing is forbidden" do
        let(:id) { user_role.id }
        run_test!
      end
    end

    patch "Attempts to update a user role" do
      tags "Core - User Roles"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :user_role_params, in: :body, schema: {
        type: :object,
        properties: {
          user_id: { type: :integer }
        }
      }

      response "403", "update is forbidden" do
        let(:id) { user_role.id }
        let(:user_role_params) { { user_id: 42 } }
        run_test!
      end
    end

    delete "Attempts to destroy a user role" do
      tags "Core - User Roles"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "403", "destruction is forbidden" do
        let(:id) { user_role.id }

        it "does not change the count" do
          expect {
            delete "/api/grit/core/user_roles/#{user_role.id}", as: :json
          }.not_to change(Grit::Core::UserRole, :count)
        end

        run_test!
      end
    end
  end
end
