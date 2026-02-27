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

RSpec.describe Grit::Compounds::BatchesController, type: :request do
  include AuthHelpers

  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:origin) { create(:grit_core_origin) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:compound) { create(:grit_compounds_compound, origin: origin, compound_type: compound_type) }
  let(:batch) { create(:grit_compounds_batch, compound: compound, compound_type: compound_type, origin: origin) }

  before do
    login_as(admin)
  end

  describe "GET /api/grit/compounds/batches" do
    it "returns success" do
      get "/api/grit/compounds/batches", as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /api/grit/compounds/batches" do
    it "creates batch" do
      expect {
        post "/api/grit/compounds/batches",
             params: {
               name: "three", number: "three",
               origin_id: origin.id, compound_type_id: compound_type.id,
               compound_id: compound.id
             },
             as: :json
      }.to change(Grit::Compounds::Batch, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe "GET /api/grit/compounds/batches/:id" do
    it "shows batch" do
      get "/api/grit/compounds/batches/#{batch.id}", as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "PATCH /api/grit/compounds/batches/:id" do
    it "updates batch" do
      patch "/api/grit/compounds/batches/#{batch.id}", params: { name: "wan" }, as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "DELETE /api/grit/compounds/batches/:id" do
    it "destroys batch" do
      batch # trigger creation
      expect {
        delete "/api/grit/compounds/batches/#{batch.id}", as: :json
      }.to change(Grit::Compounds::Batch, :count).by(-1)

      expect(response).to have_http_status(:success)
    end
  end
end
