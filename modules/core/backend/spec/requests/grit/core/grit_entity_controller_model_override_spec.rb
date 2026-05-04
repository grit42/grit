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

# Exercises the `get_model` extension point on Grit::Core::GritEntityController.
# The dummy app's Grit::OverriddenEntitiesController defines `model_override`,
# but no Grit::OverriddenEntity class exists — so the default
# `controller_path.classify.constantize` branch would NameError. Successful
# responses prove the override is wired through every relevant before_action
# and action.
RSpec.describe "GritEntityController model_override", type: :request do
  let(:admin)     { create(:grit_core_user, :admin, :with_admin_role) }
  let(:non_admin) { create(:grit_core_user) }

  describe "when model_override is defined" do
    before { login_as(admin) }

    it "resolves the model via override for index" do
      get "/api/grit/overridden_entities"
      expect(response).to have_http_status(:ok)
    end

    it "creates records on the overridden model" do
      expect {
        post "/api/grit/overridden_entities", params: { name: "x" }, as: :json
      }.to change(Grit::TestEntity, :count).by(1)
      expect(response).to have_http_status(:created)
    end

    it "passes params to model_override and uses klass.name in the forbidden message" do
      login_as(non_admin)
      post "/api/grit/overridden_entities", params: { name: "x", as_role: "1" }, as: :json
      expect(response).to have_http_status(:forbidden)
      expect(response.parsed_body["errors"]).to include("Grit::Core::Role")
    end
  end

  describe "when model_override is not defined (default branch)" do
    before { login_as(admin) }

    it "falls back to controller_path.classify.constantize" do
      get "/api/grit/test_entities"
      expect(response).to have_http_status(:ok)
    end
  end
end
