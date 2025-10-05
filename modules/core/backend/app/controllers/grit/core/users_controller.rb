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
    before_action :require_no_user, only: %i[activate request_password_reset password_reset]
    before_action :require_user, only: %i[index show update_password generate_api_token hello_world_api]

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

      raise "This activation token does not exist" unless @user
      raise "Password and password confirmation do not match" if params[:password] != params[:password_confirmation]

      params[:login] = @user.login unless params[:login]

      @user.password = params[:password]
      @user.password_confirmation = params[:password_confirmation]
      @user.activation_token = nil
      @user.active = true

      if @user.save
        render json: { success: true }
      else
        render json: { success: false, errors: @user.errors }, status: :unprocessable_entity
      end
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
        sql = "UPDATE grit_core_users SET forgot_token='#{SecureRandom.urlsafe_base64(20)}' WHERE id=#{@user.id}"
        ActiveRecord::Base.connection.execute(sql)
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

      raise "This password recovery token does not exist" unless @user
      raise "Password and password confirmation do not match" if params[:password] != params[:password_confirmation]

      params[:login] = @user.login unless params[:login]

      @user.password = params[:password]
      @user.password_confirmation = params[:password_confirmation]
      @user.forgot_token = nil
      @user.active = true

      if @user.save
        render json: { success: true }
      else
        render json: { success: false, errors: @user.errors }, status: :unprocessable_entity
      end
    rescue StandardError => e
      logger.warn e.to_s
      logger.warn e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def request_password_reset_for_user
      raise "not allowed" unless Grit::Core::User.current.role?("Administrator")
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

      token =SecureRandom.urlsafe_base64(20)

      if @user
        sql = "UPDATE grit_core_users SET forgot_token='#{token}' WHERE id=#{@user.id}"
        ActiveRecord::Base.connection.execute(sql)
      end

      Grit::Core::Mailer.deliver_password_reset(@user).deliver_now
      render json: { success: true, token: token }
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
      @user = Grit::Core::User.current

      @user.reset_single_access_token
      @user.save!

      render json: { success: true, data: { token: @user.single_access_token } }
    rescue StandardError => e
      logger.warn e.to_s
      logger.warn e.backtrace.join("\n")
      render json: { success: false, msg: e.to_s }, status: :internal_server_error
    end

    def hello_world_api
      render json: { success: true, msg: "Hello" }
    end

    def generate_api_token_for_user
      raise "not allowed" unless Grit::Core::User.current.role?("Administrator")
      @user = Grit::Core::User.find_by_email(params[:user])

      @user.reset_single_access_token
      @user.save!

      render json: { success: true, data: { token: @user.single_access_token } }
    rescue StandardError => e
      logger.warn e.to_s
      logger.warn e.backtrace.join("\n")
      render json: { success: false, msg: e.to_s }, status: :internal_server_error
    end

    def revoke_activation_token_for_user
      raise "not allowed" unless Grit::Core::User.current.role?("Administrator")
      @user = Grit::Core::User.find_by_email(params[:user])

      @user.update(
        activation_token: nil
      )

      render json: { success: true }
    rescue StandardError => e
      logger.warn e.to_s
      logger.warn e.backtrace.join("\n")
      render json: { success: false, msg: e.to_s }, status: :internal_server_error
    end

    def revoke_forgot_token_for_user
      raise "not allowed" unless Grit::Core::User.current.role?("Administrator")
      @user = Grit::Core::User.find_by_email(params[:user])

      @user.update(
        forgot_token: nil
      )

      render json: { success: true }
    rescue StandardError => e
      logger.warn e.to_s
      logger.warn e.backtrace.join("\n")
      render json: { success: false, msg: e.to_s }, status: :internal_server_error
    end

    private

    def single_access_allowed?
      action_name == "hello_world_api"
    end
  end
end
