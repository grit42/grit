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

RSpec.describe "Users API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:notadmin) { create(:grit_core_user) }
  let(:origin) { create(:grit_core_origin) }

  before(:each) do
    login_as(admin)
  end

  path "/api/grit/core/users" do
    get "Lists all users" do
      tags "Core - Users"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "anyone can list users" do
        before { login_as(notadmin) }
        run_test!
      end
    end
  end

  describe "index scoping" do
    it "admin should get index for user admin scope" do
      get "/api/grit/core/users", params: "scope=user_administration"
      expect(response).to have_http_status(:success)
    end

    it "non-admin should not get index for user admin scope" do
      login_as(notadmin)
      get "/api/grit/core/users", params: "scope=user_administration"
      expect(response).to have_http_status(:bad_request)
    end
  end

  path "/api/grit/core/users" do
    post "Creates a user" do
      tags "Core - Users"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :user_params, in: :body, schema: {
        type: :object,
        properties: {
          login: { type: :string },
          name: { type: :string },
          email: { type: :string },
          origin_id: { type: :integer },
          active: { type: :boolean },
          two_factor: { type: :boolean },
          role_ids: { type: :array, items: { type: :integer } }
        }
      }

      response "201", "user created" do
        let(:user_params) do
          {
            login: "test",
            name: "Test",
            email: "test@example.com",
            origin_id: origin.id,
            active: false,
            two_factor: false,
            role_ids: []
          }
        end

        run_test! do
          expect(Grit::Core::User.find_by(login: "test")).to be_present
        end
      end
    end
  end

  describe "user creation and activation" do
    it "should create and activate user" do
      expect {
        post "/api/grit/core/users", params: {
          login: "test",
          name: "Test",
          email: "test@example.com",
          origin_id: origin.id,
          active: false,
          two_factor: false,
          role_ids: []
        }, as: :json
      }.to change(Grit::Core::User, :count).by(1)

      expect(response).to have_http_status(:created)

      res = JSON.parse(response.body)
      new_user_id = res["data"]["id"]
      new_user = Grit::Core::User.find(new_user_id)
      login_as(new_user)

      expect(response).to have_http_status(:unauthorized)

      post "/api/grit/core/user/activate", params: {
        activation_token: new_user.activation_token,
        password: "password",
        password_confirmation: "password"
      }

      expect(response).to have_http_status(:success)

      login_as(new_user)

      expect(response).to have_http_status(:success)
    end
  end

  path "/api/grit/core/users/{id}" do
    parameter name: :id, in: :path, type: :integer

    get "Shows a user" do
      tags "Core - Users"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "anyone can show user" do
        let(:id) { notadmin.id }
        before { login_as(notadmin) }
        run_test!
      end
    end

    patch "Updates a user" do
      tags "Core - Users"
      consumes "application/json"
      produces "application/json"
      security [ { cookie_auth: [] } ]
      parameter name: :user_params, in: :body, schema: {
        type: :object,
        properties: {
          name: { type: :string }
        }
      }

      response "200", "admin updates user" do
        let(:id) { notadmin.id }
        let(:user_params) { { name: "Your name is waaat" } }
        run_test!
      end

      response "403", "non-admin cannot update other user" do
        let(:id) { admin.id }
        let(:user_params) { { name: "Administratoz" } }
        before { login_as(notadmin) }
        run_test!
      end
    end

    delete "Destroys a user" do
      tags "Core - Users"
      produces "application/json"
      security [ { cookie_auth: [] } ]

      response "200", "admin destroys user" do
        let(:id) { notadmin.id }

        run_test! do
          expect(Grit::Core::User.find_by(id: notadmin.id)).to be_nil
        end
      end

      response "403", "non-admin cannot destroy user" do
        let(:id) { notadmin.id }
        before { login_as(notadmin) }

        run_test! do
          expect(Grit::Core::User.find_by(id: notadmin.id)).to be_present
        end
      end
    end
  end

  describe "show scoping" do
    it "admin should show user for user admin scope" do
      get "/api/grit/core/users/#{notadmin.id}", params: "scope=user_administration"
      expect(response).to have_http_status(:success)
    end

    it "non-admin should not show user for user admin scope" do
      login_as(notadmin)
      get "/api/grit/core/users/#{notadmin.id}", params: "scope=user_administration"
      expect(response).to have_http_status(:bad_request)
    end
  end

  describe "self-service actions" do
    it "user should update info" do
      login_as(notadmin)
      post "/api/grit/core/user/update_info", params: { name: "My name is waaat" }, as: :json
      expect(response).to have_http_status(:success)
    end

    it "user should update settings" do
      login_as(notadmin)
      post "/api/grit/core/user/update_settings", params: { settings: { theme: "dark" } }, as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "password reset" do
    it "should reset password" do
      post "/api/grit/core/user/request_password_reset", params: { user: admin.email }, as: :json
      expect(response).to have_http_status(:success)

      admin.reload
      post "/api/grit/core/user/password_reset", params: {
        forgot_token: admin.forgot_token,
        password: "testtest",
        password_confirmation: "testtest"
      }, as: :json
      expect(response).to have_http_status(:success)

      login_as(admin, password: "testtest")
      expect(response).to have_http_status(:success)
    end

    it "should update password" do
      login_as(notadmin)
      post "/api/grit/core/user/update_password", params: {
        old_password: "password",
        password: "testtest",
        password_confirmation: "testtest"
      }, as: :json
      expect(response).to have_http_status(:success)

      login_as(notadmin, password: "testtest")
      expect(response).to have_http_status(:success)
    end
  end

  describe "failed login attempts" do
    it "user should be disabled after too many wrong password attempts" do
      login_attempts = Grit::Core::UserSession.consecutive_failed_logins_limit + 1
      login_attempts.times do
        login_as(notadmin, password: "wrongpassword")
      end
      user_record = Grit::Core::User.find_by(login: notadmin.login)
      expect(user_record.active).to eq(false)
    end
  end

  describe "API tokens" do
    it "user should pull an API token" do
      login_as(notadmin)
      post "/api/grit/core/user/generate_api_token"
      expect(response).to have_http_status(:success)
    end

    it "user should authenticate with valid token" do
      logout
      get "/api/grit/core/user/hello_world_api", params: { user_credentials: notadmin.single_access_token }
      expect(response).to have_http_status(:success)
    end

    it "user should not authenticate with an old token" do
      login_as(notadmin)
      old_token = notadmin.single_access_token
      post "/api/grit/core/user/generate_api_token"
      logout

      get "/api/grit/core/user/hello_world_api", params: { user_credentials: old_token }
      expect(response).to have_http_status(:unauthorized)
    end

    it "user should not authenticate with an invalid token" do
      logout
      get "/api/grit/core/user/hello_world_api", params: { user_credentials: "not a valid token" }
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "admin API token management" do
    it "admin should request an API token for user" do
      login_as(admin)
      post "/api/grit/core/user/generate_api_token_for_user", params: { user: notadmin.email }, as: :json
      expect(response).to have_http_status(:success)
    end

    it "non-admin should not request an API token for user" do
      login_as(notadmin)
      post "/api/grit/core/user/generate_api_token_for_user", params: { user: notadmin.email }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "admin password reset management" do
    it "admin should request a password reset for user" do
      login_as(admin)
      post "/api/grit/core/user/request_password_reset_for_user", params: { user: notadmin.email }, as: :json
      expect(response).to have_http_status(:success)
    end

    it "admin should revoke a reset password token" do
      login_as(admin)
      post "/api/grit/core/user/revoke_forgot_token_for_user", params: { user: notadmin.email }, as: :json
      expect(response).to have_http_status(:success)
    end

    it "non-admin should not revoke a reset password token" do
      login_as(notadmin)
      post "/api/grit/core/user/revoke_forgot_token_for_user", params: { user: notadmin.email }, as: :json
      expect(response).to have_http_status(:unauthorized)
    end
  end
end
