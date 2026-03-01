# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/compounds.
#
# @grit42/compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.

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
    if respond_to?(:post)
      # Request spec: use the API endpoint.
      post "/api/grit/core/user_session",
           params: { user_session: { login: user.login, password: password } }
      activate_authlogic
    else
      # Integration/model spec: use Authlogic test mode directly.
      Grit::Core::UserSession.create(user)
    end
    RequestStore.store["current_user"] = user.reload
  end

  def logout
    if respond_to?(:delete)
      delete "/api/grit/core/user_session"
      activate_authlogic
    end
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

  def silence_stderr
    original_stderr = $stderr.clone
    $stderr.reopen(File.new("/dev/null", "w"))
    yield
  ensure
    $stderr.reopen(original_stderr)
  end
end

RSpec.configure do |config|
  config.include AuthHelpers
end
