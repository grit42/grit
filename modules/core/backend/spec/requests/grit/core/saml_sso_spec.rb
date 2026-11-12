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


require "rails_helper"

RSpec.describe "SAML single sign-on", type: :request do
  let!(:origin) { create(:grit_core_origin) }

  def with_env(vars)
    previous = vars.keys.to_h { |key| [ key, ENV[key] ] }
    vars.each { |key, value| ENV[key] = value }
    yield
  ensure
    previous.each { |key, value| ENV[key] = value }
  end

  # The OmniAuth middleware is not configured in tests, so the callback receives
  # the IdP result through the Rack env as the middleware would provide it.
  def saml_callback(name_id:, email: nil)
    info = { "name" => "SAML User" }
    info["email"] = email if email
    post "/api/grit/core/auth/saml/callback",
         env: { "omniauth.auth" => { "provider" => "saml", "uid" => name_id, "info" => info } }
  end

  def logged_in_login
    get "/api/grit/core/user_session"
    return nil unless response.status == 200

    JSON.parse(response.body)["data"]["login"]
  end

  def sso_error
    Rack::Utils.parse_query(URI.parse(response.location).query)["sso_error"]
  end

  describe "the callback" do
    it "logs in the SAML user with the e-mail, ignoring case" do
      user = create(:grit_core_user, auth_method: "saml", email: "jane@example.com")

      saml_callback(name_id: "transient-1", email: "Jane@Example.com")

      expect(sso_error).to be_nil
      expect(logged_in_login).to eq(user.login)
      expect(user.reload.sso_uid).to eq("transient-1")
    end

    it "finds the user again when the NameID changes (transient NameIDs)" do
      user = create(:grit_core_user, auth_method: "saml", email: "jane@example.com", sso_uid: "transient-1")

      saml_callback(name_id: "transient-2", email: "jane@example.com")

      expect(logged_in_login).to eq(user.login)
    end

    it "uses an e-mail NameID when the response has no e-mail attribute" do
      user = create(:grit_core_user, auth_method: "saml", email: "jane@example.com")

      saml_callback(name_id: "jane@example.com")

      expect(logged_in_login).to eq(user.login)
    end

    it "refuses a response without an e-mail" do
      saml_callback(name_id: "opaque-id")

      expect(sso_error).to eq("The identity provider did not send an e-mail address")
      expect(logged_in_login).to be_nil
    end

    it "doesn't log in as a local (password) account with the same e-mail" do
      create(:grit_core_user, auth_method: "local", email: "jane@example.com")

      expect { saml_callback(name_id: "jane@example.com") }.not_to change(Grit::Core::User, :count)

      expect(sso_error).to include("No grit account uses jane@example.com")
      expect(logged_in_login).to be_nil
    end

    it "refuses an inactive user" do
      create(:grit_core_user, :inactive, auth_method: "saml", email: "jane@example.com")

      saml_callback(name_id: "jane@example.com")

      expect(sso_error).to include("is inactive")
      expect(logged_in_login).to be_nil
    end

    context "with an unknown e-mail" do
      it "refuses the login by default" do
        expect { saml_callback(name_id: "new@example.com") }.not_to change(Grit::Core::User, :count)

        expect(sso_error).to include("No grit account uses new@example.com")
      end

      it "creates a SAML user when SAML_UNKNOWN_USERS is create" do
        with_env("SAML_UNKNOWN_USERS" => "create") do
          expect { saml_callback(name_id: "new@example.com") }.to change(Grit::Core::User, :count).by(1)
        end

        user = Grit::Core::User.find_by(email: "new@example.com")
        expect(user).to have_attributes(auth_method: "saml", active: true, login: "new")
        expect(logged_in_login).to eq("new")
      end
    end
  end

  describe "creating users" do
    let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }

    before { login_as(admin) }

    def create_user(**attributes)
      post "/api/grit/core/users", params: {
        login: "newuser", name: "New User", email: "newuser@example.com", origin_id: origin.id,
        active: false, two_factor: false, role_ids: [], **attributes
      }, as: :json
      Grit::Core::User.find_by(login: "newuser")
    end

    it "makes new users SAML users on a SAML installation: active, no activation e-mail" do
      user = nil
      with_env("SSO_PROVIDER" => "saml") do
        expect { user = create_user }.not_to change(ActionMailer::Base.deliveries, :count)
      end

      expect(response).to have_http_status(:created)
      expect(user).to have_attributes(auth_method: "saml", active: true, activation_token: nil)
    end

    it "lets an administrator choose a local account on a SAML installation" do
      user = with_env("SSO_PROVIDER" => "saml") { create_user(auth_method: "local") }

      expect(user.auth_method).to eq("local")
      expect(user.activation_token).to be_present
    end

    it "keeps local the default without SAML" do
      user = create_user

      expect(user.auth_method).to eq("local")
      expect(user.activation_token).to be_present
    end

    it "rejects an unknown login method" do
      expect(create_user(auth_method: "kerberos")).to be_nil
      expect(response).to have_http_status(:unprocessable_entity)
    end

    it "lets an administrator switch an existing user to SAML" do
      user = create(:grit_core_user, email: "jane@example.com")

      put "/api/grit/core/users/#{user.id}", params: { auth_method: "saml" }, as: :json

      expect(response).to have_http_status(:ok)
      expect(user.reload.auth_method).to eq("saml")
    end
  end

  describe "the server settings" do
    it "offer SAML single sign-on to the login page" do
      with_env("SSO_PROVIDER" => "saml") { get "/api/grit/core/user_session/server_settings" }

      settings = JSON.parse(response.body)["data"]
      expect(settings).to include("sso_provider" => "saml", "sso_login_path" => "/api/grit/core/auth/saml")
    end
  end
end
