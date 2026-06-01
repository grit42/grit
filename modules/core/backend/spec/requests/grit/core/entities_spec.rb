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

# Security finding A: entities controller allow-list prevents arbitrary
# constantize of user-supplied class names.
RSpec.describe "Entities API — allow-list security", type: :request do
  let(:admin)    { create(:grit_core_user, :admin, :with_administrator_role) }
  let(:no_roles) { create(:grit_core_user) }

  before { login_as(admin) }

  describe "GET /api/grit/core/entities/:entity_id/columns" do
    context "with an arbitrary Ruby class" do
      it "returns 400 and does not constantize Kernel" do
        get "/api/grit/core/entities/Kernel/columns", as: :json
        expect(response).to have_http_status(:bad_request)
        expect(JSON.parse(response.body)["errors"]).to eq("Unknown entity")
      end

      it "returns 400 for a non-entity ActiveRecord class" do
        get "/api/grit/core/entities/ActiveRecord::Base/columns", as: :json
        expect(response).to have_http_status(:bad_request)
        expect(JSON.parse(response.body)["errors"]).to eq("Unknown entity")
      end

      it "returns 400 for a made-up class name" do
        get "/api/grit/core/entities/Totally::Fake::Class/columns", as: :json
        expect(response).to have_http_status(:bad_request)
        expect(JSON.parse(response.body)["errors"]).to eq("Unknown entity")
      end
    end

    context "with a valid entity" do
      it "returns columns for a user with sufficient permission" do
        get "/api/grit/core/entities/Grit::Core::Country/columns", as: :json
        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)["success"]).to be true
      end

      it "returns 403 for a user without the entity's read permission" do
        login_as(no_roles) # no roles = no permissions
        get "/api/grit/core/entities/Grit::Core::Country/columns", as: :json
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /api/grit/core/entities/:entity_id/fields" do
    it "returns 400 for an arbitrary class" do
      get "/api/grit/core/entities/Kernel/fields", as: :json
      expect(response).to have_http_status(:bad_request)
    end

    it "returns fields for a valid entity with permission" do
      get "/api/grit/core/entities/Grit::Core::Country/fields", as: :json
      expect(response).to have_http_status(:ok)
    end
  end
end
