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


require "rails_helper"

RSpec.describe "Compound Loading Integration", type: :integration do
  include AuthHelpers
  include ActionDispatch::TestProcess::FixtureFile

  # Non-transactional so load set workflow (multi-step with separate transactions) works correctly
  self.use_transactional_tests = false if respond_to?(:use_transactional_tests=)

  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:origin) { create(:grit_core_origin) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }

  before do
    login_as(admin)
  end

  after do
    # Clean up non-transactional records
    Grit::Compounds::MoleculesCompound.where(
      compound_id: Grit::Compounds::Compound.where("name LIKE ? OR name LIKE ?", "integration-%", "dup_mol").pluck(:id)
    ).destroy_all
    Grit::Compounds::Compound.where("name LIKE ? OR name LIKE ?", "integration-%", "dup_mol").destroy_all
    Grit::Core::LoadSet.where("name LIKE ?", "integration-test-%").destroy_all
  end

  describe "full SDF compound loading workflow" do
    it "creates compound and molecule" do
      expect {
        post "/api/grit/core/load_sets", params: {
          name: "integration-test-compound-load",
          entity: "Grit::Compounds::Compound",
          origin_id: origin.id,
          load_set_blocks: {
            "0" => {
              name: "sdf-block",
              separator: "$$$$",
              compound_type_id: compound_type.id,
              structure_format: "molfile",
              data: fixture_file_upload(
                File.join(FILE_FIXTURE_PATH, "simple_integration.sdf"),
                "chemical/x-mdl-sdfile"
              )
            }
          }
        }
      }.to change(Grit::Core::LoadSet, :count).by(1)

      expect(response).to have_http_status(:created)
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-compound-load")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      expect(response).to have_http_status(:success)

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_1" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }
      expect(response).to have_http_status(:success)
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy

      compound_count_before = Grit::Compounds::Compound.count
      molecules_compound_count_before = Grit::Compounds::MoleculesCompound.count

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      expect(response).to have_http_status(:success)
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy

      expect(Grit::Compounds::Compound.count).to eq(compound_count_before + 1)
      expect(Grit::Compounds::MoleculesCompound.count).to eq(molecules_compound_count_before + 1)

      compound = Grit::Compounds::Compound.order(:id).last
      expect(compound.compound_type_id).to eq(compound_type.id)
      expect(compound.origin_id).to eq(origin.id)
    end
  end

  describe "SDF with multiple molecules" do
    it "creates multiple compounds" do
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-multiple",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "multi-block",
            separator: "$$$$",
            compound_type_id: compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload(
              File.join(FILE_FIXTURE_PATH, "multiple.sdf"),
              "chemical/x-mdl-sdfile"
            )
          }
        }
      }
      expect(response).to have_http_status(:created)

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-multiple")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      expect(response).to have_http_status(:success)

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_1" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }
      expect(response).to have_http_status(:success)

      expect {
        post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      }.to change(Grit::Compounds::Compound, :count).by(2)
        .and change(Grit::Compounds::MoleculesCompound, :count).by(2)
      expect(response).to have_http_status(:success)
    end
  end

  describe "loading compound with existing molecule" do
    it "links to existing molecule without duplication" do
      Grit::Compounds::MoleculesCompound.destroy_all
      Grit::Compounds::Molecule.destroy_all
      Grit::Compounds::Batch.destroy_all
      Grit::Compounds::Compound.destroy_all

      # First load: create a compound with a molecule
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-first-load",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "first-block",
            separator: "$$$$",
            compound_type_id: compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload(
              File.join(FILE_FIXTURE_PATH, "simple.sdf"),
              "chemical/x-mdl-sdfile"
            )
          }
        }
      }
      expect(response).to have_http_status(:created)

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-first-load")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_1" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      expect(response).to have_http_status(:success)

      first_molecule = Grit::Compounds::Molecule.order(:id).last

      # Second load: same structure should link to existing molecule
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-second-load",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "second-block",
            separator: "$$$$",
            compound_type_id: compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload(
              File.join(FILE_FIXTURE_PATH, "simple.sdf"),
              "chemical/x-mdl-sdfile"
            )
          }
        }
      }
      expect(response).to have_http_status(:created)

      load_set2 = Grit::Core::LoadSet.find_by(name: "integration-test-second-load")
      load_set_block2 = load_set2.load_set_blocks.first

      post "/api/grit/core/load_set_blocks/#{load_set_block2.id}/initialize_data"

      post "/api/grit/core/load_set_blocks/#{load_set_block2.id}/validate", params: {
        mappings: {
          "name" => { "constant" => true, "value" => "dup_mol" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }
      expect(response).to have_http_status(:success)

      load_set_block2.reload
      expect(load_set_block2.has_warnings).to be_truthy

      expect {
        post "/api/grit/core/load_set_blocks/#{load_set_block2.id}/confirm"
      }.to change(Grit::Compounds::Compound, :count).by(1)
        .and change(Grit::Compounds::Molecule, :count).by(0)
      expect(response).to have_http_status(:success)

      new_compound = Grit::Compounds::Compound.order(:id).last
      molecules_compound = Grit::Compounds::MoleculesCompound.find_by(compound_id: new_compound.id)
      expect(molecules_compound.molecule_id).to eq(first_molecule.id)
    end
  end

  describe "invalid molfile structure" do
    it "causes validation error" do
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-malformed",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "malformed-block",
            separator: "$$$$",
            compound_type_id: compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload(
              File.join(FILE_FIXTURE_PATH, "malformed.sdf"),
              "chemical/x-mdl-sdfile"
            )
          }
        }
      }
      expect(response).to have_http_status(:created)

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-malformed")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"

      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_falsey

      load_set_block.reload
      expect(load_set_block.error).to be_truthy
    end
  end

  describe "rollback" do
    it "removes compound molecule and link records" do
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-rollback",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "rollback-block",
            separator: "$$$$",
            compound_type_id: compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload(
              File.join(FILE_FIXTURE_PATH, "simple.sdf"),
              "chemical/x-mdl-sdfile"
            )
          }
        }
      }

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-rollback")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_1" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      expect(response).to have_http_status(:success)

      expect {
        post "/api/grit/core/load_set_blocks/#{load_set_block.id}/rollback"
      }.to change(Grit::Compounds::Compound, :count).by(-1)
        .and change(Grit::Compounds::Molecule, :count).by(-1)
        .and change(Grit::Compounds::MoleculesCompound, :count).by(-1)

      expect(response).to have_http_status(:success)
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy
    end
  end

  describe "API response format" do
    it "has correct JSON structure" do
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-response",
        entity: "Grit::Compounds::Compound",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "response-block",
            separator: "$$$$",
            compound_type_id: compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload(
              File.join(FILE_FIXTURE_PATH, "simple.sdf"),
              "chemical/x-mdl-sdfile"
            )
          }
        }
      }

      response_data = JSON.parse(response.body)
      expect(response_data.keys).to include("success")
      expect(response_data.keys).to include("data")
      expect(response_data["success"]).to be_truthy

      data = response_data["data"]
      expect(data.keys).to include("id")
      expect(data.keys).to include("name")
      expect(data.keys).to include("entity")
      expect(data["entity"]).to eq("Grit::Compounds::Compound")

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-response")
      load_set_block = load_set.load_set_blocks.order(:id).first

      # Test initialize_data response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy
      expect(response_data["data"].keys).to include("id")
      expect(response_data["data"].keys).to include("status_id")

      # Test validate response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_1" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy
      expect(response_data["data"].keys).to include("id")

      # Test confirm response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy
      expect(response_data["data"].keys).to include("id")
    end
  end
end
