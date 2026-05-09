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

RSpec.describe "Roles API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:notadmin) { create(:grit_core_user, :with_user_role) }
  let(:role) { Grit::Core::Role.find_by!(name: "Administrator") }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/roles" do
    get "Lists all roles" do
      tags "Core - Roles"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "roles listed" do
        before { login_as(admin) }
        run_test!
      end
    end

    post "Creates a role" do
      tags "Core - Roles"
      consumes "application/json"
      produces "application/json"
      security [ { bearer_auth: [] } ]
      parameter name: :role_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string },
          description: { type: :string }
        }
      }

      response "201", "role created" do
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
      security [ { bearer_auth: [] } ]

      response "200", "role found" do
        let(:id) { role.id }
        before { login_as(admin) }
        run_test!
      end
    end

    patch "Updates a role" do
      tags "Core - Roles"
      consumes "application/json"
      produces "application/json"
      security [ { bearer_auth: [] } ]
      parameter name: :role_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "200", "role updated" do
        let(:id) { role.id }
        let(:role_params) { { name: "Updated role" } }
        before { login_as(admin) }
        run_test!
      end
    end

    delete "Deletes a role" do
      tags "Core - Roles"
      produces "application/json"
      security [ { bearer_auth: [] } ]

      response "200", "role deleted" do
        let(:id) { role.id }
        before { login_as(admin) }
        run_test!
      end
    end
  end


  it "allows index with 'read:users'" do
    login_as(notadmin)
    get "/api/grit/core/roles", as: :json
    expect(response).to have_http_status(:success)
  end

  it "allows show with 'read:users'" do
    login_as(notadmin)
    get "/api/grit/core/roles/#{role.id}", as: :json
    expect(response).to have_http_status(:success)
  end

  it "allows create with 'admin:users'" do
    expect {
      post "/api/grit/core/roles", params: { name: "Test1", description: "Test role" }, as: :json
  }.to change(Grit::Core::Role, :count)
    expect(response).to have_http_status(:created)
  end

  it "allows update with 'admin:users'" do
    patch "/api/grit/core/roles/#{role.id}", params: { name: "Testtest1" }, as: :json
    expect(response).to have_http_status(:success)
  end

  it "allows destroy with 'admin:users'" do
    expect {
      delete "/api/grit/core/roles/#{role.id}", as: :json
  }.to change(Grit::Core::Role, :count)
    expect(response).to have_http_status(:success)
  end

  it "forbids create without 'admin:users'" do
    login_as(notadmin)
    expect {
      post "/api/grit/core/roles", params: { name: "Test2", description: "Test role" }, as: :json
    }.not_to change(Grit::Core::Role, :count)
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids update without 'admin:users'" do
    login_as(notadmin)
    patch "/api/grit/core/roles/#{role.id}", params: { name: "Testtest2" }, as: :json
    expect(response).to have_http_status(:forbidden)
  end

  it "forbids destroy without 'admin:users'" do
    login_as(notadmin)
    expect {
      delete "/api/grit/core/roles/#{role.id}", as: :json
    }.not_to change(Grit::Core::Role, :count)
    expect(response).to have_http_status(:forbidden)
  end
end
