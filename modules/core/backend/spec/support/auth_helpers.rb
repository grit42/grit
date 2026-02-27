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


# Shared authentication helpers for request specs.
# Provides login/logout via the Grit Core session API.
module AuthHelpers
  def login_as(user, password: "password")
    post "/api/grit/core/user_session",
         params: { user_session: { login: user.login, password: password } },
         as: :json
  end

  def logout
    delete "/api/grit/core/user_session", as: :json
  end
end

RSpec.configure do |config|
  config.include AuthHelpers, type: :request
end
