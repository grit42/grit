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

RSpec.describe "User Sessions API", type: :request do
  let(:admin) { create(:grit_core_user, :admin, :with_administrator_role) }

  describe "login cookie" do
    it "is not sent with cross-site requests" do
      # The credentials cookie is Secure, so it is only written over HTTPS.
      https!
      login_as(admin)

      set_cookies = Array(response.headers["Set-Cookie"]).flat_map { |c| c.split("\n") }
      credentials_cookie = set_cookies.find { |c| c.start_with?("grit_core_user_credentials=") }
      expect(credentials_cookie).to be_present
      expect(credentials_cookie).to match(/;\s*samesite=lax/i)
    end
  end

  describe "rate limiting" do
    # The test environment uses a null cache store, which never counts.
    let(:counter_store) { ActiveSupport::Cache::MemoryStore.new }

    before do
      allow(Grit::Core::UserSessionsController.cache_store).to receive(:increment) do |*args, **options|
        counter_store.increment(*args, **options)
      end
    end

    it "refuses logins from an address after 10 attempts, including for admin" do
      10.times do
        post "/api/grit/core/user_session", params: { user_session: { login: admin.login, password: "wrong" } }
        expect(response).to have_http_status(:unauthorized)
      end

      post "/api/grit/core/user_session", params: { user_session: { login: admin.login, password: "password" } }
      expect(response).to have_http_status(:too_many_requests)
      expect(JSON.parse(response.body)["success"]).to be(false)
    end

    it "refuses two factor attempts from an address after 10 attempts" do
      10.times do
        post "/api/grit/core/user_session/two_factor", params: { user: admin.login, token: "WRONG" }
        expect(response).not_to have_http_status(:too_many_requests)
      end

      post "/api/grit/core/user_session/two_factor", params: { user: admin.login, token: "WRONG" }
      expect(response).to have_http_status(:too_many_requests)
    end

    it "counts login and two factor attempts separately" do
      10.times do
        post "/api/grit/core/user_session", params: { user_session: { login: admin.login, password: "wrong" } }
      end
      post "/api/grit/core/user_session", params: { user_session: { login: admin.login, password: "wrong" } }
      expect(response).to have_http_status(:too_many_requests)

      post "/api/grit/core/user_session/two_factor", params: { user: admin.login, token: "WRONG" }
      expect(response).not_to have_http_status(:too_many_requests)
    end
  end
end
