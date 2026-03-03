# frozen_string_literal: true

Rswag::Api.configure do |c|
  c.openapi_root = Rails.root.join("openapi")
end
