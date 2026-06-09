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

module Grit::Core::Controller::Authenticated
  extend ActiveSupport::Concern
  included do
    helper_method :current_user_session, :current_user

    before_action :authenticate_via_strategies
    before_action :set_bearer_token
    before_action :require_user

    private
    def authenticate_via_strategies
      Grit::Core::AuthenticationStrategies.each do |strategy|
        user = strategy.authenticate(request)
        next unless user

        @current_user = user
        RequestStore.store["current_user"] = user
        return
      end
    end

    def set_bearer_token
      return if defined?(@current_user) && @current_user

      header = request.headers["Authorization"]
      return unless header&.start_with?("Bearer ")

      token = header.sub("Bearer ", "")
      params[:user_credentials] = token unless token.blank?
    end

    def require_user
      return if current_user

      render json: { success: false, errors: "Not logged in" }, status: :unauthorized
    end

    def single_access_allowed?
      params[:user_credentials].present?
    end

    def current_user_session
      return @current_user_session if defined?(@current_user_session)
      @current_user_session = Grit::Core::UserSession.find
    end

    def current_user
      return @current_user if defined?(@current_user)
      @current_user = current_user_session && current_user_session.user
    end
  end
end
