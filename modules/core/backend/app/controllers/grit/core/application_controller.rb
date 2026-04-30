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
      before_action :set_bearer_token

      def set_csrf_token
        cookies["csrf-token"] = form_authenticity_token
      end

      # Extract a Bearer token from the Authorization header and inject it
      # into params[:user_credentials] so that Authlogic's built-in
      # single_access_token lookup (via UserSession.params_key) can find it.
      # This enables standard "Authorization: Bearer <token>" header auth
      # while preserving backwards compatibility with the query param style.
      def set_bearer_token
        header = request.headers["Authorization"]
        return unless header&.start_with?("Bearer ")

        token = header.sub("Bearer ", "")
        params[:user_credentials] = token unless token.blank?
      end

      private

        # Allow Authlogic single_access_token authentication for any request
        # type when a Bearer token is present. Without this, Authlogic only
        # permits single access for RSS/Atom content types by default.
        # Controllers can still override this method to be more restrictive
        # (e.g. UsersController limits it to hello_world_api).
        def single_access_allowed?
          request.headers["Authorization"]&.start_with?("Bearer ") ||
            params[:user_credentials].present?
        end

        def current_user_session
          return @current_user_session if defined?(@current_user_session)
          @current_user_session = UserSession.find
        end

        def current_user
          return @current_user if defined?(@current_user)
          @current_user = if token_authenticated?
            token_user
          else
            current_user_session && current_user_session.user
          end
        end

        def token_authenticated?
          request.headers["Authorization"]&.start_with?("Bearer ")
        end

        def token_user
          token = request.headers["Authorization"].sub("Bearer ", "")
          user = Grit::Core::User.find_by(single_access_token: token)
          return nil if user&.single_access_token_expired?
          user
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
