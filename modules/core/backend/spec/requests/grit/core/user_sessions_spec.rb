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
end
