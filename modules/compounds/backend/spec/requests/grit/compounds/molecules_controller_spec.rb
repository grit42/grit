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

RSpec.describe Grit::Compounds::MoleculesController, type: :request do
  include AuthHelpers

  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:molecule) { create(:grit_compounds_molecule, :ethanol) }
  let(:valid_molfile) { File.read(File.join(FILE_FIXTURE_PATH, "simple.sdf")).split("> <").first }

  before do
    login_as(admin)
  end

  describe "POST /api/grit/compounds/molecules/molecule_exists" do
    let(:url) { "/api/grit/compounds/molecules/molecule_exists" }

    it "checks if molecule exists with valid molfile" do
      post url, params: { molfile: valid_molfile }, as: :json

      expect(response).to have_http_status(:success)
      response_body = JSON.parse(response.body)
      expect(response_body["success"]).to be_truthy
      expect(response_body["data"]["molfile"]).to eq(valid_molfile)
      expect(response_body["data"]["existing_molecule_id"]).to be_nil
      expect(response_body["data"]["existing_molecule_compounds"]).to be_empty
    end

    it "checks if molecule exists with existing molecule" do
      existing_molfile = molecule.molfile
      post url, params: { molfile: existing_molfile }, as: :json

      expect(response).to have_http_status(:success)
      response_body = JSON.parse(response.body)
      expect(response_body["success"]).to be_truthy
      if response_body["data"]["existing_molecule_id"].present?
        expect(response_body["data"]["existing_molecule_id"]).to eq(molecule.id)
        expect(response_body["data"]["existing_molecule_compounds"].length).to eq(1)
      end
    end

    it "handles invalid molfile" do
      silence_stderr do
        post url, params: { molfile: "invalid structure data" }, as: :json
      end

      expect(response).to have_http_status(:success)
      response_body = JSON.parse(response.body)
      expect(response_body["success"]).to be_truthy
      expect(response_body["data"]["existing_molecule_id"]).to be_nil
      expect(response_body["data"]["existing_molecule_compounds"]).to be_empty
    end

    it "handles empty molfile" do
      silence_stderr do
        post url, params: { molfile: "" }, as: :json
      end

      expect(response).to have_http_status(:success)
      response_body = JSON.parse(response.body)
      expect(response_body["success"]).to be_truthy
      expect(response_body["data"]["existing_molecule_id"]).to be_nil
      expect(response_body["data"]["existing_molecule_compounds"]).to be_empty
    end

    it "requires authentication" do
      logout
      post url, params: { molfile: valid_molfile }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
