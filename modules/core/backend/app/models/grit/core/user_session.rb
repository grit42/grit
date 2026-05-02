#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

# frozen_string_literal: true

module Grit::Core
  class UserSession < Authlogic::Session::Base
    consecutive_failed_logins_limit ENV.fetch("MAX_FAILED_LOGINS", 50).to_i
    logout_on_timeout ENV.fetch("SESSION_EXPIRY_ENABLED", "false") == "true"
    timeout ENV.fetch("SESSION_EXPIRY_MINUTES", 60).to_i.minutes

    def cookie_key
      "grit_core_user_credentials"
    end

    def params_key
      "user_credentials"
    end
  end
end
