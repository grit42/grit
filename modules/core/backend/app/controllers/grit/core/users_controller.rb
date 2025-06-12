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

module Grit::Core
  class UsersController < ApplicationController
    include Grit::Core::GritEntityController

      before_action :require_administrator, only: %i[create update destroy]
      before_action :require_no_user, only: %i[activate request_password_reset request_password_reset]
      before_action :require_user, only: %i[update_password]

      def create
        user = params.require(:user).permit(:origin_id, :location_id, :login, :name, :active, :email, :two_factor, role_ids: [])
        record = Grit::Core::User.new(user)
        record.activation_token = SecureRandom.urlsafe_base64(20)

        Grit::Core::Mailer.deliver_activation_instructions(record).deliver_now

        if record.save
          scope = get_scope(params[:scope] || "detailed", params)
          record = scope.find(record.id)
          render json: { success: true, data: record }, status: :created, location: record
        else
          render json: { success: false, errors: record.errors }, status: :unprocessable_entity
        end
      rescue StandardError => e
        logger.warn e.to_s
        logger.warn e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
      end

      def update
        permitted_params = params.permit([ :name, :email, :origin_id, :location_id, :two_factor, :active, role_ids: [] ])

        @record = Grit::Core::User.find(params[:id])

        if permitted_params[:role_ids]
          @record.user_roles.each do |user_role|
            user_role.destroy unless permitted_params[:role_ids].include?(user_role.role_id)
          end
          permitted_params[:role_ids].each do |role_id|
            @record.user_roles << Grit::Core::UserRole.new(role_id: role_id, user_id: @record.id)
          end
          @record.save!
        end

        if @record.update(permitted_params)
          scope = get_scope(params[:scope] || "detailed", params)
          @record = scope.find(params[:id])
          render json: { success: true, data: @record }
        else
          render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
        end
      rescue StandardError => e
        logger.warn e.to_s
        logger.warn e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
      end

      def activate
        @user = Grit::Core::User.find_by(activation_token: params[:activation_token])

        raise "This token does not exist" unless @user
        raise "Password and password confirmation do not match" if params[:password] != params[:password_confirmation]

        params[:login] = @user.login unless params[:login]

        @user.update(
          password: params[:password],
          password_confirmation: params[:password_confirmation],
          activation_token: nil,
          active: true
        )

        Grit::Core::UserSession.create(@user)
        render json: { success: true }
      rescue StandardError => e
        logger.warn e.to_s
        logger.warn e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
      end

      def request_password_reset
        if params[:user].nil? || !params[:user].is_a?(String)
          render json: { success: false, errors: "No user specified" }, status: :bad_request
          return
        end

        @user = Grit::Core::User.find_by(login: params[:user]&.downcase)
        @user = Grit::Core::User.find_by(email: params[:user]&.downcase)

        if @user.nil?
          render json: { success: false, errors: "No user found" }, status: :not_found
          return
        end

        if @user
          @user.update(
            forgot_token: SecureRandom.urlsafe_base64(20)
          )
        end

        Grit::Core::Mailer.deliver_password_reset(@user).deliver_now
        render json: { success: true }
      rescue StandardError => e
        logger.warn e.to_s
        logger.warn e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
      end

      def password_reset
        raise "No token specified" if params[:forgot_token].nil?

        @user = Grit::Core::User.find_by(forgot_token: params[:forgot_token])

        raise "This token does not exist" unless @user
        raise "Password and password confirmation do not match" if params[:password] != params[:password_confirmation]

        params[:login] = @user.login unless params[:login]

        @user.update(
          password: params[:password],
          password_confirmation: params[:password_confirmation],
          forgot_token: nil,
          active: true
        )

        Grit::Core::UserSession.create(@user)
        render json: { success: true }
      rescue StandardError => e
        logger.warn e.to_s
        logger.warn e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
      end

      def update_password
        user = Grit::Core::User.current
        unless user.valid_password?(params[:old_password])
          render json: { success: false, errors: { old_password: [ "Wrong password" ] } }, status: :unauthorized
          return
        end
        user.password = params[:password]
        user.password_confirmation = params[:password_confirmation]

        if user.save
          render json: { success: true }
        else
        render json: { success: false, errors: user.errors }, status: :unprocessable_entity
        end
      rescue StandardError => e
        logger.warn e.to_s
        logger.warn e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
      end

      def update_settings
        user = Grit::Core::User.current
        user.settings = params[:settings]
        user.save!

        render json: { success: true }
      rescue StandardError => e
        logger.warn e.to_s
        logger.warn e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
      end

      def update_info
        user = Grit::Core::User.current

        if user.update(params.permit([ :name ]))
          render json: { success: true }
        else
          render json: { success: false, errors: user.errors }, status: :unprocessable_entity
        end
      rescue StandardError => e
        logger.warn e.to_s
        logger.warn e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
      end
      
      def generate_api_token
		@user = User.current
		length = 32
		token = rand(36**length).to_s(36) # random string of a-z and 0-9

		@user.update(
		  auth_token: token
		)

		render json: { success: true, data: { token: token } }
	  rescue StandardError => e
		logger.warn e.to_s
		logger.warn e.backtrace.join("\n")
		render json: { success: false, msg: e.to_s }, status: :internal_server_error
	  end

	  def revoke_api_token
		@user = User.current

		@user.update(
		  auth_token: nil
		)

		render json: { success: true }
	  rescue StandardError => e
		logger.warn e.to_s
		logger.warn e.backtrace.join("\n")
		render json: { success: false, msg: e.to_s }, status: :internal_server_error
	  end
  end
end
