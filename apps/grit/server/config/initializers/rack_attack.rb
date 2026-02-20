# frozen_string_literal: true

if ENV["RATE_LIMITING_ENABLED"] == "true"
  class Rack::Attack
    # Login attempts: 10 per minute per IP
    throttle("login_attempts", limit: 10, period: 1.minute) do |req|
      req.ip if req.path == "/api/grit/core/user_session" && req.post?
    end

    # Password reset request: 3 per hour per email
    throttle("password_reset_request", limit: 3, period: 1.hour) do |req|
      req.params[:user] if req.path == "/api/grit/core/user/request_password_reset" && req.post?
    end

    # Password reset action: 10 per hour per token
    throttle("password_reset_action", limit: 10, period: 1.hour) do |req|
      req.params[:forgot_token] if req.path == "/api/grit/core/user/password_reset" && req.post?
    end
  end
end
