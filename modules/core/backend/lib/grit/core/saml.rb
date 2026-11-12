# frozen_string_literal: true

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
    # SAML single sign-on settings (SSO_PROVIDER=saml), read from the
    # environment:
    #
    # SAML_IDP_METADATA_URL  the identity provider's metadata (required)
    # SAML_EMAIL_ATTRIBUTE   the attribute carrying the user's e-mail; when the
    #                        response lacks it, an e-mail NameID is used
    # SAML_SP_ENTITY_ID      our entity id (default: <GRIT_SERVER_URL>/api/grit/core/auth/saml/metadata)
    # SAML_ACS_URL           our callback URL (default: <GRIT_SERVER_URL>/api/grit/core/auth/saml/callback)
    # SAML_UNKNOWN_USERS     "refuse" (default) or "create": what a login with
    #                        an e-mail no grit user has does
    #
    # A site moving from the old Animals app keeps its IdP setup by setting
    # SAML_SP_ENTITY_ID=https://<host>/saml/metadata and
    # SAML_ACS_URL=https://<host>/saml/consume; the old paths are served too
    # (see LegacyPaths).
    module Saml
      BASE_PATH = "/api/grit/core/auth/saml"
      CALLBACK_PATH = "#{BASE_PATH}/callback"
      METADATA_PATH = "#{BASE_PATH}/metadata"
      EMAIL_NAME_ID_FORMAT = "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
      # The IdP's metadata (endpoints, signing certificates) is fetched on the
      # first login and kept this long; a failed login refetches it, so a
      # certificate rotation needs no restart.
      IDP_METADATA_TTL = 24 * 60 * 60

      @mutex = Mutex.new

      class << self
        def enabled?
          ENV.fetch("SSO_PROVIDER", "none").downcase == "saml"
        end

        def create_unknown_users?
          ENV.fetch("SAML_UNKNOWN_USERS", "refuse").downcase == "create"
        end

        def email_attribute
          ENV.fetch("SAML_EMAIL_ATTRIBUTE", nil).presence
        end

        def sp_entity_id
          ENV.fetch("SAML_SP_ENTITY_ID", nil).presence || "#{server_url}#{METADATA_PATH}"
        end

        def acs_url
          ENV.fetch("SAML_ACS_URL", nil).presence || "#{server_url}#{CALLBACK_PATH}"
        end

        # Our own settings, for the OmniAuth strategy.
        def sp_options
          {
            sp_entity_id: sp_entity_id,
            assertion_consumer_service_url: acs_url,
            name_identifier_format: EMAIL_NAME_ID_FORMAT,
            attribute_statements: attribute_statements
          }
        end

        # The IdP's settings from its metadata, cached (see IDP_METADATA_TTL).
        def idp_options
          @mutex.synchronize do
            if @idp_options.nil? || @idp_options_fetched_at < Time.now - IDP_METADATA_TTL
              @idp_options = fetch_idp_options
              @idp_options_fetched_at = Time.now
            end
            @idp_options
          end
        end

        def expire_idp_options!
          @mutex.synchronize { @idp_options = nil }
        end

        # The e-mail of a SAML login: the configured attribute (or the usual
        # e-mail attributes), else the NameID when it is an e-mail.
        def email_from(auth)
          email = auth.dig("info", "email").to_s.strip
          email = auth["uid"].to_s.strip if email.blank? && auth["uid"].to_s.match?(URI::MailTo::EMAIL_REGEXP)
          email.downcase.presence
        end

        private

          def server_url
            url = ENV.fetch("GRIT_SERVER_URL", nil).presence
            raise "SAML needs GRIT_SERVER_URL (the app's public URL), or SAML_SP_ENTITY_ID and SAML_ACS_URL" unless url

            url.chomp("/")
          end

          def attribute_statements
            defaults = OmniAuth::Strategies::SAML.default_options[:attribute_statements].to_h.symbolize_keys
            return defaults unless email_attribute

            defaults.merge(email: [ email_attribute ] + Array(defaults[:email]))
          end

          def fetch_idp_options
            url = ENV.fetch("SAML_IDP_METADATA_URL")
            parser = OneLogin::RubySaml::IdpMetadataParser.new
            parser.parse_remote_to_hash(url, true, name_id_format: EMAIL_NAME_ID_FORMAT)
              .slice(:idp_entity_id, :idp_sso_service_url, :idp_sso_service_binding, :idp_cert, :idp_cert_fingerprint, :idp_cert_multi)
              .compact
          end
      end

      # The old Animals app's SAML paths, for an IdP set up against it:
      # /saml/consume and /saml/metadata are handled as the new callback and
      # metadata paths, and /saml/init (a link to start a login) opens the
      # login page.
      class LegacyPaths
        REWRITES = { "/saml/consume" => CALLBACK_PATH, "/saml/metadata" => METADATA_PATH }.freeze

        def initialize(app)
          @app = app
        end

        def call(env)
          path = env["PATH_INFO"]
          return [ 302, { "location" => "/app/core/authenticate" }, [] ] if path == "/saml/init"

          if (target = REWRITES[path])
            # The response's destination is checked against SAML_ACS_URL, not
            # against the path it arrived on, so the rewrite is transparent.
            env = env.merge("PATH_INFO" => target)
            # The metadata is served on GET; the old app's route was a POST.
            env["REQUEST_METHOD"] = "GET" if target == METADATA_PATH
          end
          @app.call(env)
        end
      end
    end
  end
end
