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

RSpec.describe "SSO Sessions API", type: :request do
  let!(:origin) { create(:grit_core_origin) }

  # The OmniAuth middleware is not configured in tests, so the callback receives
  # the IdP result through the Rack env as the middleware would provide it.
  def sso_callback(uid:, email:, email_verified: nil)
    info = { "email" => email, "name" => "SSO User", "nickname" => "sso_user" }
    info["email_verified"] = email_verified unless email_verified.nil?
    get "/api/grit/core/auth/oidc/callback",
        env: { "omniauth.auth" => { "provider" => "oidc", "uid" => uid, "info" => info } }
  end

  def logged_in_login
    get "/api/grit/core/user_session"
    return nil unless response.status == 200

    JSON.parse(response.body)["data"]["login"]
  end

  describe "linking an existing account by email" do
    it "does not move an account linked to another identity" do
      linked = create(:grit_core_user, auth_method: "oidc", sso_uid: "linked-uid", email: "linked@example.com")

      sso_callback(uid: "other-uid", email: "linked@example.com", email_verified: true)

      expect(response.location).to include("sso_error")
      expect(linked.reload.sso_uid).to eq("linked-uid")
      expect(logged_in_login).to be_nil
    end

    it "does not link an account when the IdP marks the email unverified" do
      unlinked = create(:grit_core_user, auth_method: "oidc", sso_uid: nil, email: "unlinked@example.com")

      sso_callback(uid: "new-uid", email: "unlinked@example.com", email_verified: false)

      expect(response.location).to include("sso_error")
      expect(unlinked.reload.sso_uid).to be_nil
      expect(logged_in_login).to be_nil
    end

    it "links an account that is not yet linked" do
      unlinked = create(:grit_core_user, auth_method: "oidc", sso_uid: nil, email: "unlinked@example.com")

      sso_callback(uid: "new-uid", email: "unlinked@example.com", email_verified: true)

      expect(response.location).not_to include("sso_error")
      expect(unlinked.reload.sso_uid).to eq("new-uid")
      expect(logged_in_login).to eq(unlinked.login)
    end
  end
end
