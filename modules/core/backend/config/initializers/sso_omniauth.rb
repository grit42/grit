# frozen_string_literal: true

# Configure OmniAuth SSO middleware when SSO_PROVIDER is set.
# Follows the same pattern as session_store.rb — the engine's initializer
# directory is auto-loaded by the host Rails app.
#
# When SSO_PROVIDER is "none" (the default), no OmniAuth middleware is loaded
# and the gems don't need to be required.

Rails.application.configure do
  sso_provider = ENV.fetch("SSO_PROVIDER", "none").downcase

  next unless %w[oidc].include?(sso_provider)

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
  end
end
