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
  class SsoSessionsController < ApplicationController
    # OmniAuth callback — called after successful IdP authentication.
    # Finds or creates a user from IdP attributes, creates an Authlogic
    # session, and redirects to the SPA.
    def create
      auth = request.env["omniauth.auth"]

      provider = auth["provider"].to_s
      uid      = auth["uid"].to_s
      info     = auth["info"] || {}

      email = provider == "saml" ? Grit::Core::Saml.email_from(auth) : info["email"].to_s.downcase.presence
      name  = info["name"].to_s.presence || [ info["first_name"], info["last_name"] ].compact.join(" ").presence
      # Try login from IdP attributes, fall back to email prefix, then uid
      login = (info["login"] || info["nickname"]).to_s.presence || email&.split("@")&.first || uid

      raise "SSO authentication did not return a usable identifier" if login.blank?

      user = if provider == "saml"
        find_or_create_saml_user!(uid: uid, email: email, name: name, login: login)
      else
        # Generate a placeholder email if the IdP didn't provide one.
        # The user or an admin can update it later.
        if email.blank?
          email = "#{login}@sso.placeholder"
          Rails.logger.warn "[SSO] IdP did not return an email for uid=#{uid}, using placeholder: #{email}"
        end

        find_or_create_sso_user!(provider: provider, uid: uid, email: email, email_verified: info["email_verified"], name: name, login: login)
      end

      raise "User #{user.login} is inactive" unless user.active?

      # Create Authlogic session (cookie-based)
      Grit::Core::UserSession.create!(user)
      user.update_columns(forgot_token: nil)

      redirect_to "/app", allow_other_host: false
    rescue StandardError => e
      Rails.logger.error "[SSO] Callback error: #{e.message}"
      Rails.logger.error e.backtrace.first(5).join("\n")
      redirect_to "/app/core/authenticate?sso_error=#{ERB::Util.url_encode(e.message)}", allow_other_host: false
    end

    # OmniAuth failure — called when the IdP returns an error or
    # the user cancels authentication.
    def failure
      message = params[:message] || "Unknown SSO error"
      Rails.logger.warn "[SSO] Authentication failure: #{message}"
      redirect_to "/app/core/authenticate?sso_error=#{ERB::Util.url_encode(message)}", allow_other_host: false
    end

    private

      def find_or_create_sso_user!(provider:, uid:, email:, email_verified:, name:, login:)
        # First, try to find by SSO UID (returning user)
        user = Grit::Core::User.find_by(auth_method: provider, sso_uid: uid)
        return user if user

        # Second, link a pre-provisioned account with the same email. Only an account not
        # yet linked to an IdP identity, so one identity cannot take over another's account,
        # and not when the IdP marks the email unverified.
        user = Grit::Core::User.find_by(email: email, auth_method: provider, sso_uid: nil)
        if user
          raise "SSO email address is not verified" if email_verified.to_s == "false"

          user.update!(sso_uid: uid)
          return user
        end

        create_sso_user!(provider: provider, uid: uid, email: email, name: name, login: login)
      end

      # SAML users are found by e-mail, as in the old Animals app: the NameID
      # may be transient (new each login), so it can't identify a returning
      # user. Only accounts an administrator made SAML accounts are found, so
      # the IdP can't log in as a local (password) account. A login with an
      # unknown e-mail is refused, or creates a user when SAML_UNKNOWN_USERS
      # is "create".
      def find_or_create_saml_user!(uid:, email:, name:, login:)
        raise "The identity provider did not send an e-mail address" if email.blank?

        user = Grit::Core::User.where("LOWER(email) = ?", email).find_by(auth_method: "saml")
        if user
          user.update_columns(sso_uid: uid) if user.sso_uid != uid && !Grit::Core::User.exists?(auth_method: "saml", sso_uid: uid)
          return user
        end

        raise "No grit account uses #{email} for single sign-on. Ask an administrator for access." unless Grit::Core::Saml.create_unknown_users?

        create_sso_user!(provider: "saml", uid: uid, email: email, name: name, login: login)
      end

      # JIT provision: create a new user
      def create_sso_user!(provider:, uid:, email:, name:, login:)
        # Ensure login uniqueness by appending a suffix if needed
        base_login = login
        counter = 0
        while Grit::Core::User.exists?(login: login)
          counter += 1
          login = "#{base_login}_#{counter}"
        end

        # The GritEntityRecord concern auto-generates presence validations for
        # every NOT NULL column, so origin_id is required. Use the first
        # available origin (seeded as "ADMIN", id=1).
        default_origin = Grit::Core::Origin.first
        raise "No origins exist — run seeds first" unless default_origin

        user = Grit::Core::User.new(
          login: login,
          name: name || login,
          email: email,
          auth_method: provider,
          sso_uid: uid,
          active: true,
          created_by: "sso",
          origin_id: default_origin.id
        )
        user.save!
        user
      end
  end
end
