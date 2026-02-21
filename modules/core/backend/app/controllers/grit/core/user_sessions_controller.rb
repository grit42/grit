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
  class UserSessionsController < ApplicationController
    before_action :require_no_user, only: %i[create two_factor]
    before_action :require_user, only: %i[show destroy]

    def platform_information
      modules = Rails::Engine.descendants.each_with_object({}) do |engine, memo|
        if engine.module_parents.include?(Grit)
          memo[engine.module_parents[0].name.underscore] = "#{engine.module_parents[0]}::VERSION".constantize
        end
        memo
      end
      { modules: modules }
    end

    def server_settings
      {
        two_factor: ENV.fetch("SMTP_SERVER", nil) ? true : false,
        server_url: ENV.fetch("GRIT_SERVER_URL", nil)
      }
    end

    def show(_params = nil)
      render json: {
            success: true,
            data: {
              id: current_user_session.record.id,
              login: current_user_session.record.login,
              name: current_user_session.record.name,
              email: current_user_session.record.email,
              token: current_user_session.record.single_access_token,
              roles: Grit::Core::User.current.roles.select(:name).all.map(&:name),
              settings: current_user_session.record.settings,
              platform_information: platform_information,
              server_settings: server_settings
            }
          }
    rescue StandardError => e
      logger.error e.to_s
      Rails.logger.debug e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def create
      @user = Grit::Core::User.find_by(login: params[:user_session][:login].downcase)
      if @user.nil?
        @user = Grit::Core::User.find_by(email: params[:user_session][:login].downcase)
        params[:user_session][:login] = @user.login unless @user.nil?
      end
      raise "User #{params[:user_session][:login]} not found" if @user.nil?
      raise "User #{params[:user_session][:login]} is inactive" if @user.active? == false

      if !@user.valid_password?(params[:user_session][:password]) then
        @user.failed_login_count ||= 0
        @user.failed_login_count += 1
        @user.save!
        if @user.failed_login_count > Grit::Core::UserSession.consecutive_failed_logins_limit then
          @user.active = false
          @user.failed_login_count = 0
          @user.activation_token = SecureRandom.urlsafe_base64(20)
          @user.save!
          Grit::Core::Mailer.deliver_reactivation_instructions(@user).deliver_now
          raise "Invalid password. Number of failed login attempts exceed limit, account have been disabled"
        else
          raise "Invalid password"
        end
      end

      two_factor = false
      if @user.two_factor == true
        da_token = SecureRandom.alphanumeric(8).upcase
        @user.two_factor_token = da_token
        @user.two_factor_expiry = Grit::Core::User::TWO_FACTOR_EXPIRY_MINUTES.minutes.from_now
        @user.two_factor_attempts = 0
        @user.save!
        two_factor = true
        Grit::Core::Mailer.deliver_two_factor_instructions(@user).deliver_now
      else
        Grit::Core::UserSession.create!(@user)
        @user.update(
          forgot_token: nil,
          forgot_token_expires_at: nil,
        )
      end
      render json: { success: true, data: { login: @user.login, twoFactor: two_factor } }
    rescue StandardError => e
      logger.error e.to_s
      Rails.logger.debug e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :unauthorized
    end

    def destroy
      current_user_session.destroy
      cookies.delete :user_login
      render json: { success: true }
    end

    def two_factor
      raise "Missing user id" if params[:user].blank?
      raise "Missing token" if params[:token].blank?

      @user = Grit::Core::User.find_by(login: params[:user].downcase)
      @user = Grit::Core::User.find_by(email: params[:user].downcase) if @user.nil?
      raise "Invalid request" if @user.nil?

      raise "Account temporarily locked due to too many failed attempts. Try again later." if @user.two_factor_locked?
      raise "Token has expired. Please log in again." if @user.two_factor_token_expired?

      unless ActiveSupport::SecurityUtils.secure_compare(@user.two_factor_token.to_s, params[:token].upcase)
        @user.record_failed_two_factor_attempt!
        raise "Invalid token"
      end

      @user.reset_two_factor_state!
      @user.update!(
        forgot_token: nil,
        forgot_token_expires_at: nil,
      )

      Grit::Core::UserSession.create(@user)
      render json: { success: true }
    rescue StandardError => e
      logger.warn e.to_s
      logger.warn e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

      def user_session_params
        params.require(:user_session).permit(:login, :password)
      end
  end
end
