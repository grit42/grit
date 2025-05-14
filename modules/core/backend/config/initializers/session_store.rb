Rails.application.configure do
  config.session_store :cookie_store, key: "_grit_session"
  config.middleware.use ActionDispatch::Cookies
  config.middleware.use config.session_store, config.session_options
end
