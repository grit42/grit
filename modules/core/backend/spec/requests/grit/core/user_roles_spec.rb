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

RSpec.describe "User Roles API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:notadmin) { create(:grit_core_user, :with_read_role) }
  let(:admin_role) { Grit::Core::Role.find_by!(name: "Administrator") }
  let(:read_role) { Grit::Core::Role.find_by!(name: "Read") }
  let(:admin_user_role) { Grit::Core::UserRole.find_by!(user: admin, role: admin_role) }
  let(:target_user) { create(:grit_core_user) }
  let(:target_user_role) { create(:grit_core_user_role, user: target_user, role: read_role) }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/user_roles" do
    get "Lists user roles" do
      tags "Core - User Roles"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "listing is allowed with 'admin:users'" do
        run_test!
      end
    end

    post "Creates a user role" do
      tags "Core - User Roles"
      consumes "application/json"
      produces "application/json"
      security [ { bearer_auth: [] } ]
      parameter name: :user_role_params, in: :body, schema: {
        type: :object,
        properties: {
          user_id: { type: :integer },
          role_id: { type: :integer }
        }
      }

      response "201", "creation is allowed with 'admin:users'" do
        let(:user_role_params) { { user_id: target_user.id, role_id: read_role.id } }
        run_test!
      end
    end
  end

  path "/api/grit/core/user_roles/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a user role" do
      tags "Core - User Roles"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "showing is allowed with 'admin:users'" do
        let(:id) { admin_user_role.id }
        run_test!
      end
    end

    patch "Updates a user role" do
      tags "Core - User Roles"
      consumes "application/json"
      produces "application/json"
      security [ { bearer_auth: [] } ]
      parameter name: :user_role_params, in: :body, schema: {
        type: :object,
        properties: {
          user_id: { type: :integer }
        }
      }

      response "200", "update is allowed with 'admin:users'" do
        let(:id) { target_user_role.id }
        let(:user_role_params) { { user_id: notadmin.id } }
        run_test!
      end
    end

    delete "Destroys a user role" do
      tags "Core - User Roles"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "destruction is allowed with 'admin:users'" do
        let(:id) { target_user_role.id }
        run_test!
      end
    end
  end

  it "destruction changes the count" do
    target_user_role
    expect {
      delete "/api/grit/core/user_roles/#{target_user_role.id}", as: :json
    }.to change(Grit::Core::UserRole, :count).by(-1)
  end

  it "forbids listing without 'admin:users'" do
    login_as(notadmin)
    get "/api/grit/core/user_roles", as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids showing without 'admin:users'" do
    login_as(notadmin)
    get "/api/grit/core/user_roles/#{admin_user_role.id}", as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids creation without 'admin:users'" do
    target_user
    login_as(notadmin)
    expect {
      post "/api/grit/core/user_roles", params: { user_id: target_user.id, role_id: read_role.id }, as: :json
    }.not_to change(Grit::Core::UserRole, :count)
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids update without 'admin:users'" do
    target_user_role
    login_as(notadmin)
    patch "/api/grit/core/user_roles/#{target_user_role.id}", params: { user_id: notadmin.id }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids destruction without 'admin:users'" do
    target_user_role
    login_as(notadmin)
    expect {
      delete "/api/grit/core/user_roles/#{target_user_role.id}", as: :json
    }.not_to change(Grit::Core::UserRole, :count)
    expect(response).to have_http_status(:forbidden)
  end
end
