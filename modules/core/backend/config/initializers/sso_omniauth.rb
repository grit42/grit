# frozen_string_literal: true

# Configure OmniAuth SSO middleware when SSO_PROVIDER is set.
# Follows the same pattern as session_store.rb — the engine's initializer
# directory is auto-loaded by the host Rails app.
#
# When SSO_PROVIDER is "none" (the default), no OmniAuth middleware is loaded
# and the gems don't need to be required.
#
# SAML configuration:
#   Option A (recommended): set SAML_IDP_METADATA_URL and everything is
#     auto-discovered from the IdP metadata (SSO URL, signing certificate).
#   Option B: set SAML_IDP_SSO_URL + SAML_IDP_CERT manually.
#
#   Optional: SAML_SP_ENTITY_ID (defaults to "grit"),
#             SAML_NAME_ID_FORMAT (defaults to "unspecified").

Rails.application.configure do
  sso_provider = ENV.fetch("SSO_PROVIDER", "none").downcase

  next unless %w[saml oidc].include?(sso_provider)

  require "omniauth"

  # Keep SSO paths under the core engine's URL namespace
  OmniAuth.config.path_prefix = "/api/grit/core/auth"

  # Let our controller handle failures instead of OmniAuth's default error page
  OmniAuth.config.on_failure = Proc.new do |env|
    if env["omniauth.error"]
      Rails.logger.error "[SSO] OmniAuth error: #{env["omniauth.error"].class}: #{env["omniauth.error"].message}"
    end
    OmniAuth::FailureEndpoint.new(env).redirect_to_failure
  end

  # Disable OmniAuth's built-in CSRF verification. This is an API-only Rails
  # app so the standard Rack::Protection middleware is absent. The SSO
  # initiation POST is protected by same-origin policy.
  OmniAuth.config.request_validation_phase = nil

  case sso_provider
  when "saml"
    require "omniauth-saml"

    # Build SAML options — prefer metadata URL for auto-discovery, fall back
    # to explicit SSO URL + certificate.
    saml_options = {
      sp_entity_id: ENV.fetch("SAML_SP_ENTITY_ID", "grit"),
      name_identifier_format: ENV.fetch("SAML_NAME_ID_FORMAT", "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"),
      idp_sso_service_url_runtime_params: {},
      request_attributes: {},
      attribute_statements: {
        email: [ "email", "urn:oid:0.9.2342.19200300.100.1.3", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" ],
        name:  [ "name", "displayName", "urn:oid:2.16.840.1.113730.3.1.241", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" ],
        login: [ "login", "uid", "urn:oid:0.9.2342.19200300.100.1.1", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" ]
      },
      security: {
        authn_requests_signed: false,
        want_assertions_signed: true,
        want_assertions_encrypted: false
      }
    }

    metadata_url = ENV.fetch("SAML_IDP_METADATA_URL", nil)
    if metadata_url
      # Fetch IdP metadata and merge the discovered settings (idp_sso_service_url,
      # idp_cert / idp_cert_multi, name_identifier_format, etc.)
      begin
        idp_metadata_parser = OneLogin::RubySaml::IdpMetadataParser.new
        parsed = idp_metadata_parser.parse_remote_to_hash(metadata_url, false)
        Rails.logger.info "[SSO] Loaded IdP metadata from #{metadata_url}"

        saml_options[:idp_sso_service_url]  = parsed[:idp_sso_service_url]
        saml_options[:idp_cert]             = parsed[:idp_cert]             if parsed[:idp_cert]
        saml_options[:idp_cert_fingerprint] = parsed[:idp_cert_fingerprint] if parsed[:idp_cert_fingerprint]
        saml_options[:idp_cert_multi]       = parsed[:idp_cert_multi]       if parsed[:idp_cert_multi]
      rescue => e
        # Log the raw response body for debugging when parsing fails
        body = idp_metadata_parser&.response&.body
        Rails.logger.error "[SSO] Failed to load IdP metadata from #{metadata_url}: #{e.class}: #{e.message}"
        Rails.logger.error "[SSO] Response body (first 500 chars): #{body&.slice(0, 500)}" if body
        raise "Failed to load SAML IdP metadata from #{metadata_url}: #{e.message}"
      end
    end

    # Explicit env vars override metadata-derived values
    saml_options[:idp_sso_service_url] = ENV["SAML_IDP_SSO_URL"] if ENV["SAML_IDP_SSO_URL"]
    saml_options[:idp_cert]            = ENV["SAML_IDP_CERT"]    if ENV["SAML_IDP_CERT"]

    unless saml_options[:idp_sso_service_url]
      raise "SAML SSO requires either SAML_IDP_METADATA_URL or SAML_IDP_SSO_URL"
    end

    config.middleware.use OmniAuth::Builder do
      provider :saml, **saml_options
    end

  when "oidc"
    require "omniauth_openid_connect"
    config.middleware.use OmniAuth::Builder do
      provider :openid_connect,
        name: :oidc,
        scope: [ :openid, :email, :profile ],
        response_type: :code,
        issuer: ENV.fetch("OIDC_ISSUER"),
        client_options: {
          identifier: ENV.fetch("OIDC_CLIENT_ID"),
          secret:     ENV.fetch("OIDC_CLIENT_SECRET"),
          redirect_uri: nil  # auto-derived from path_prefix + /oidc/callback
        },
        discovery: true
    end
  end
end
