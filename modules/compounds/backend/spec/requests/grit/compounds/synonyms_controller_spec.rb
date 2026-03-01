# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/compounds.
#
# @grit42/compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.


require "openapi_helper"

RSpec.describe Grit::Compounds::SynonymsController, type: :request do
  include AuthHelpers

  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:compound_user) do
    user = create(:grit_core_user, login: "compounduser", name: "CompoundUser", email: "compounduser@test.com")
    role = Grit::Core::Role.find_or_create_by!(name: "CompoundUser") { |r| r.description = "Compound user" }
    Grit::Core::UserRole.find_or_create_by!(user: user, role: role)
    user
  end
  let!(:notadmin) do
    create(:grit_core_user, login: "notadmin", name: "NotAdmin", email: "notadmin@test.com")
  end
  let(:compound) { create(:grit_compounds_compound) }
  let(:synonym) { create(:grit_compounds_synonym, name: "wan", compound: compound) }

  before do
    login_as(compound_user)
  end

  describe "GET /api/grit/compounds/synonyms" do
    it "anyone can get index" do
      login_as(notadmin)
      get "/api/grit/compounds/synonyms", as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /api/grit/compounds/synonyms" do
    it "creates synonym" do
      expect {
        post "/api/grit/compounds/synonyms",
             params: { name: "wann", compound_id: compound.id },
             as: :json
      }.to change(Grit::Compounds::Synonym, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe "GET /api/grit/compounds/synonyms/:id" do
    it "shows synonym" do
      get "/api/grit/compounds/synonyms/#{synonym.id}", as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "PATCH /api/grit/compounds/synonyms/:id" do
    it "updates synonym" do
      patch "/api/grit/compounds/synonyms/#{synonym.id}", params: { name: "wann" }, as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "DELETE /api/grit/compounds/synonyms/:id" do
    it "destroys synonym" do
      synonym # trigger creation
      expect {
        delete "/api/grit/compounds/synonyms/#{synonym.id}", as: :json
      }.to change(Grit::Compounds::Synonym, :count).by(-1)

      expect(response).to have_http_status(:success)
    end
  end
end
