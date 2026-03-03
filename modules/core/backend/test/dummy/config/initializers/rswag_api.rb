# frozen_string_literal: true

Rswag::Api.configure do |c|
  c.openapi_root = Rails.root.join("../../../../../apps/grit/server/openapi").expand_path
end
