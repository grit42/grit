# frozen_string_literal: true

# Configure OmniAuth SSO middleware when SSO_PROVIDER is set.
# Follows the same pattern as session_store.rb — the engine's initializer
# directory is auto-loaded by the host Rails app.
#
# When SSO_PROVIDER is "none" (the default), no OmniAuth middleware is loaded
# and the gems don't need to be required.

Rails.application.configure do
  sso_provider = ENV.fetch("SSO_PROVIDER", "none").downcase

  next unless %w[saml oidc].include?(sso_provider)

  require "omniauth"

  # Keep SSO paths under the core engine's URL namespace
  OmniAuth.config.path_prefix = "/api/grit/core/auth"

  # Let our controller handle failures instead of OmniAuth's default error page
  OmniAuth.config.on_failure = Proc.new do |env|
    OmniAuth::FailureEndpoint.new(env).redirect_to_failure
  end

  case sso_provider
  when "saml"
    require "omniauth-saml"
    config.middleware.use OmniAuth::Builder do
      provider :saml,
        idp_sso_service_url:  ENV.fetch("SAML_IDP_SSO_URL"),
        idp_cert:             ENV.fetch("SAML_IDP_CERT"),
        sp_entity_id:         ENV.fetch("SAML_SP_ENTITY_ID"),
        idp_sso_service_url_runtime_params: {},
        name_identifier_format: ENV.fetch("SAML_NAME_ID_FORMAT", "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"),
        request_attributes: {},
        attribute_statements: {
          email: [ "email", "urn:oid:0.9.2342.19200300.100.1.3", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" ],
          name:  [ "name", "displayName", "urn:oid:2.16.840.1.113730.3.1.241", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" ],
          login: [ "login", "uid", "urn:oid:0.9.2342.19200300.100.1.1", "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" ]
        }
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
