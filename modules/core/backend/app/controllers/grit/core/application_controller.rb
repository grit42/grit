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

module Grit
  module Core
    class ApplicationController < ActionController::API
      include ActionController::Cookies
      include ActionController::RequestForgeryProtection

      protect_from_forgery with: :null_session, prepend: true,
      if: proc { |c| c.request.format =~ %r{application/json} }

      helper_method :current_user_session, :current_user

      before_action :set_csrf_token

      def set_csrf_token
        cookies["csrf-token"] = form_authenticity_token
      end

      private

        def current_user_session
          return @current_user_session if defined?(@current_user_session)
          @current_user_session = UserSession.find
        end

        def current_user
          return @current_user if defined?(@current_user)
          @current_user = current_user_session && current_user_session.user
        end

        def require_user
          return if current_user

          render json: { success: false, errors: "Not logged in" }, status: :unauthorized
        end

        def require_no_user
          return unless current_user

          false
        end

        def require_administrator
          return true if Grit::Core::User.current.role?("Administrator")

          render json: { success: false, errors: "Insufficient roles" }, status: :unauthorized
        end
    end
  end
end
