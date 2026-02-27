# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

RSpec.configure do |config|
  config.openapi_root = File.expand_path("../openapi", __dir__)

  config.openapi_specs = {
    "core/openapi.json" => {
      openapi: "3.0.1",
      info: {
        title: "Grit Core API",
        version: "v1",
        description: "Core module API for the grit platform — users, sessions, entities, and data loading."
      },
      servers: [
        { url: "http://localhost:3000", description: "Development server" }
      ],
      components: {
        securitySchemes: {
          cookie_auth: {
            type: :apiKey,
            name: "_grit_session",
            in: :cookie
          }
        }
      },
      security: [ { cookie_auth: [] } ]
    }
  }

  config.openapi_format = :json
end
