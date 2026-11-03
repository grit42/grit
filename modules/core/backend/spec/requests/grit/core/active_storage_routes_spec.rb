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

RSpec.describe "ActiveStorage routes", type: :request do
  # ActiveStorage's own controllers have no grit authentication, so anyone could
  # upload blobs through them. Files are uploaded and served by grit controllers.
  it "does not expose direct uploads" do
    post "/rails/active_storage/direct_uploads",
         params: { blob: { filename: "x.txt", byte_size: 1, checksum: "x", content_type: "text/plain" } },
         as: :json
    expect(response).to have_http_status(:not_found)
  end

  it "draws none of its routes" do
    paths = Rails.application.routes.routes.map { |route| route.path.spec.to_s }
    expect(paths.grep(%r{\A/rails/active_storage})).to be_empty
  end
end
