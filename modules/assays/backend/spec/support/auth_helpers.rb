# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/assays.
#
# @grit42/assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/assays. If not, see <https://www.gnu.org/licenses/>.

module AuthHelpers
  # Request spec login: uses the API endpoint.
  # IMPORTANT: Do NOT use `as: :json` here. The ApplicationController has
  # `protect_from_forgery with: :null_session` for JSON requests, which
  # nullifies the session when no CSRF token is present. Sending as a
  # regular form POST avoids this, allowing the session cookie to persist
  # across subsequent requests in the test.
  # After the POST succeeds, store the real user in RequestStore so that
  # factory_bot creates triggered by lazy `let` blocks use a valid User
  # for set_updater callbacks instead of hitting UserSession.find.
  def login_as(user, password: "password")
    post "/api/grit/core/user_session",
         params: { user_session: { login: user.login, password: password } }
    # The RequestStore middleware clears RequestStore after each HTTP
    # request, which wipes :authlogic_controller. Re-activate so that
    # any subsequent factory_bot creates can call UserSession.new.
    activate_authlogic
    RequestStore.store["current_user"] = user.reload
  end

  def logout
    delete "/api/grit/core/user_session"
    activate_authlogic
    RequestStore.store["current_user"] = Struct.new(:login, :id) do
      def role?(_name = nil) = true
      def active? = true
    end.new("factory_bootstrap", 0)
  end

  # Model spec login: uses Authlogic test mode
  def set_current_user(user)
    Grit::Core::UserSession.create(user)
    RequestStore.store.delete("current_user")
  end
end

RSpec.configure do |config|
  config.include AuthHelpers
end
