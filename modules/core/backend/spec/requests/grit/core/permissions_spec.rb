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


require "swagger_helper"

RSpec.describe "Permissions API", type: :request do
  let(:reader) { create(:grit_core_user, :with_read_role) }
  let(:no_role_user) { create(:grit_core_user) }

  it "allows index with 'read:system'" do
    login_as(reader)
    get "/api/grit/core/permissions", as: :json
    expect(response).to have_http_status(:success)
  end

  it "forbids index without 'read:system'" do
    login_as(no_role_user)
    get "/api/grit/core/permissions", as: :json
    expect(response).to have_http_status(:forbidden)
  end
end
