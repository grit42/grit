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

RSpec.describe Grit::Compounds::BatchPropertiesController, type: :request do
  include AuthHelpers

  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:compound_admin) do
    user = create(:grit_core_user, login: "compoundadmin", name: "CompoundAdministrator", email: "compoundadmin@test.com")
    role = Grit::Core::Role.find_or_create_by!(name: "CompoundAdministrator") { |r| r.description = "Compound administrator" }
    Grit::Core::UserRole.find_or_create_by!(user: user, role: role)
    user
  end
  let(:notadmin) do
    create(:grit_core_user, login: "notadmin", name: "NotAdmin", email: "notadmin@test.com")
  end
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:data_type) { create(:grit_core_data_type, :string) }
  let(:batch_property) do
    create(:grit_compounds_batch_property,
           compound_type: compound_type,
           data_type: data_type)
  end

  before do
    login_as(compound_admin)
  end

  describe "GET /api/grit/compounds/batch_properties" do
    it "anyone can get index" do
      login_as(notadmin)
      get "/api/grit/compounds/batch_properties"
      expect(response).to have_http_status(:success)
    end
  end

  describe "POST /api/grit/compounds/batch_properties" do
    it "creates batch_property" do
      integer_type = create(:grit_core_data_type, :integer)
      expect {
        post "/api/grit/compounds/batch_properties",
             params: {
               name: "Three", safe_name: "three",
               compound_type_id: compound_type.id, data_type_id: integer_type.id,
               sort: 0, required: false
             },
             as: :json
      }.to change(Grit::Compounds::BatchProperty, :count).by(1)

      expect(response).to have_http_status(:created)
    end
  end

  describe "GET /api/grit/compounds/batch_properties/:id" do
    it "shows batch_property" do
      get "/api/grit/compounds/batch_properties/#{batch_property.id}", as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "PATCH /api/grit/compounds/batch_properties/:id" do
    it "updates batch_property" do
      patch "/api/grit/compounds/batch_properties/#{batch_property.id}",
            params: { name: "wan" }, as: :json
      expect(response).to have_http_status(:success)
    end
  end

  describe "DELETE /api/grit/compounds/batch_properties/:id" do
    it "does not destroy batch_property with value" do
      batch = create(:grit_compounds_batch, compound_type: compound_type)
      create(:grit_compounds_batch_property_value,
             batch_property: batch_property,
             batch: batch)

      expect {
        delete "/api/grit/compounds/batch_properties/#{batch_property.id}", as: :json
      }.not_to change(Grit::Compounds::BatchProperty, :count)

      expect(response).to have_http_status(:internal_server_error)
    end
  end
end
