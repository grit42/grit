# frozen_string_literal: true

# Configure OmniAuth SSO middleware when SSO_PROVIDER is set (oidc or saml).
# Follows the same pattern as session_store.rb — the engine's initializer
# directory is auto-loaded by the host Rails app.
#
# When SSO_PROVIDER is "none" (the default), no OmniAuth middleware is loaded
# and the gems don't need to be required.

Rails.application.configure do
  sso_provider = ENV.fetch("SSO_PROVIDER", "none").downcase

  next unless %w[oidc saml].include?(sso_provider)

  require "omniauth"

  # Keep SSO paths under the core engine's URL namespace
  OmniAuth.config.path_prefix = "/api/grit/core/auth"

  # Let our controller handle failures instead of OmniAuth's default error page
  OmniAuth.config.on_failure = Proc.new do |env|
    if env["omniauth.error"]
      Rails.logger.error "[SSO] OmniAuth error: #{env["omniauth.error"].class}: #{env["omniauth.error"].message}"
    end
    # A failed SAML login refetches the IdP's metadata next time, in case its
    # signing certificate was rotated.
    Grit::Core::Saml.expire_idp_options! if env["omniauth.error.strategy"]&.name.to_s == "saml"
    OmniAuth::FailureEndpoint.new(env).redirect_to_failure
  end

  # Disable OmniAuth's built-in CSRF verification. This is an API-only Rails
  # app so the standard Rack::Protection middleware is absent. The SSO
  # initiation POST is protected by same-origin policy.
  OmniAuth.config.request_validation_phase = nil

  case sso_provider
  when "oidc"
    require "omniauth_openid_connect"

    oidc_issuer = ENV.fetch("OIDC_ISSUER")
    issuer_uri  = URI.parse(oidc_issuer)

    # The SWD gem (used by openid_connect for discovery) defaults to HTTPS.
    # Override to HTTP when the issuer URL uses plain HTTP (e.g. local dev).
    if issuer_uri.scheme == "http"
      require "swd"
      SWD.url_builder = URI::HTTP
    end

    # Build the OIDC callback URL. OIDC_REDIRECT_URI takes precedence if set
    # explicitly; otherwise we derive it from GRIT_SERVER_URL (the app's
    # public origin). The callback path must match OmniAuth's path_prefix +
    # provider name + "/callback".
    oidc_callback_path = "/api/grit/core/auth/oidc/callback"
    oidc_redirect_uri  = ENV.fetch("OIDC_REDIRECT_URI") {
      server_url = ENV.fetch("GRIT_SERVER_URL", nil)
      server_url ? "#{server_url.chomp('/')}#{oidc_callback_path}" : nil
    }

    unless oidc_redirect_uri
      raise <<~MSG
        OIDC redirect_uri cannot be determined. Set either OIDC_REDIRECT_URI
        or GRIT_SERVER_URL so the app knows its own public URL.
        Example: GRIT_SERVER_URL=http://localhost:3001
                 (callback will be http://localhost:3001#{oidc_callback_path})
      MSG
    end

    config.middleware.use OmniAuth::Builder do
      provider :openid_connect,
        name: :oidc,
        scope: [ :openid, :email, :profile ],
        response_type: :code,
        issuer: oidc_issuer,
        client_options: {
          identifier: ENV.fetch("OIDC_CLIENT_ID"),
          secret:     ENV.fetch("OIDC_CLIENT_SECRET"),
          redirect_uri: oidc_redirect_uri
        },
        discovery: true
    end
  when "saml"
    require "omniauth-saml"

    # Settings: see Grit::Core::Saml. Our own are read now, so a missing
    # GRIT_SERVER_URL fails at start; the IdP's metadata is fetched (and
    # cached) on the first login, so the app starts while the IdP is down.
    sp_options = Grit::Core::Saml.sp_options

    # The old Animals app's /saml/... paths, before OmniAuth sees the request.
    config.middleware.use Grit::Core::Saml::LegacyPaths

    config.middleware.use OmniAuth::Builder do
      provider :saml,
        name: :saml,
        **sp_options,
        setup: lambda { |env|
          # Our own metadata doesn't need the IdP's.
          next if env["PATH_INFO"] == Grit::Core::Saml::METADATA_PATH

          env["omniauth.strategy"].options.merge!(Grit::Core::Saml.idp_options)
        }
    end
  end
end
