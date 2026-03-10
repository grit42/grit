# frozen_string_literal: true

Rswag::Ui.configure do |c|
  # Each engine module generates its own OpenAPI spec.
  # The swagger-ui dropdown lists each module separately.
  c.openapi_endpoint "/api-docs/core/openapi.json", "Core API"
  c.openapi_endpoint "/api-docs/compounds/openapi.json", "Compounds API"
  c.openapi_endpoint "/api-docs/assays/openapi.json", "Assays API"
end
