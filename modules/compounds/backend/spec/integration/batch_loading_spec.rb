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

RSpec.describe "Batch Loading Integration", type: :request do
  include AuthHelpers
  include ActionDispatch::TestProcess::FixtureFile

  # Non-transactional so load set workflow (multi-step with separate transactions) works correctly
  self.use_transactional_tests = false if respond_to?(:use_transactional_tests=)

  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:origin) { create(:grit_core_origin) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:compound) { create(:grit_compounds_compound, origin: origin, compound_type: compound_type) }

  before do
    login_as(admin)
  end

  after do
    # Clean up non-transactional records
    Grit::Compounds::Batch.where("name LIKE ?", "batch-%").destroy_all
    Grit::Core::LoadSet.where("name LIKE ?", "integration-test-batch-%").destroy_all
  end

  describe "full CSV batch loading workflow" do
    it "creates batch linked to compound" do
      csv_content = "name,compound_number\nbatch-001,#{compound.number}"
      csv_file = Tempfile.new([ "batch_test", ".csv" ])
      csv_file.write(csv_content)
      csv_file.rewind

      post "/api/grit/core/load_sets", params: {
        name: "integration-test-batch-load",
        entity: "Grit::Compounds::Batch",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "batch-block",
            separator: ",",
            compound_type_id: compound_type.id,
            data: Rack::Test::UploadedFile.new(csv_file.path, "text/csv")
          }
        }
      }

      expect(response).to have_http_status(:created)
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-batch-load")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      expect(response).to have_http_status(:success)

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_0" },
          "compound_id" => { "header" => "col_1", "find_by" => "number" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }
      expect(response).to have_http_status(:success)

      expect {
        post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      }.to change(Grit::Compounds::Batch, :count).by(1)
      expect(response).to have_http_status(:success)

      batch = Grit::Compounds::Batch.order(:id).last
      expect(batch.compound_id).to eq(compound.id)
      expect(batch.compound_type_id).to eq(compound_type.id)
      expect(batch.origin_id).to eq(origin.id)

      csv_file.close
      csv_file.unlink
    end
  end

  describe "batch loading with invalid compound reference" do
    it "shows validation error" do
      csv_content = "name,compound_number\nbatch-invalid,NONEXISTENT_COMPOUND"
      csv_file = Tempfile.new([ "batch_invalid", ".csv" ])
      csv_file.write(csv_content)
      csv_file.rewind

      post "/api/grit/core/load_sets", params: {
        name: "integration-test-batch-invalid",
        entity: "Grit::Compounds::Batch",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "batch-invalid-block",
            separator: ",",
            compound_type_id: compound_type.id,
            data: Rack::Test::UploadedFile.new(csv_file.path, "text/csv")
          }
        }
      }
      expect(response).to have_http_status(:created)

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-batch-invalid")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      expect(response).to have_http_status(:success)

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_0" },
          "compound_id" => { "header" => "col_1", "find_by" => "number" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }

      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_falsey

      load_set_block.reload
      expect(load_set_block.has_errors).to be_truthy

      csv_file.close
      csv_file.unlink
    end
  end

  describe "batch rollback" do
    it "removes created batch" do
      csv_content = "name,compound_number\nbatch-rollback,#{compound.number}"
      csv_file = Tempfile.new([ "batch_rollback", ".csv" ])
      csv_file.write(csv_content)
      csv_file.rewind

      post "/api/grit/core/load_sets", params: {
        name: "integration-test-batch-rollback",
        entity: "Grit::Compounds::Batch",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "batch-rollback-block",
            separator: ",",
            compound_type_id: compound_type.id,
            data: Rack::Test::UploadedFile.new(csv_file.path, "text/csv")
          }
        }
      }
      expect(response).to have_http_status(:created)

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-batch-rollback")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_0" },
          "compound_id" => { "header" => "col_1", "find_by" => "number" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      expect(response).to have_http_status(:success)

      expect {
        post "/api/grit/core/load_set_blocks/#{load_set_block.id}/rollback"
      }.to change(Grit::Compounds::Batch, :count).by(-1)
      expect(response).to have_http_status(:success)

      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy

      csv_file.close
      csv_file.unlink
    end
  end

  describe "batch loading API response structure" do
    it "has correct structure" do
      csv_content = "name,compound_number\nbatch-response,#{compound.number}"
      csv_file = Tempfile.new([ "batch_response", ".csv" ])
      csv_file.write(csv_content)
      csv_file.rewind

      post "/api/grit/core/load_sets", params: {
        name: "integration-test-batch-response",
        entity: "Grit::Compounds::Batch",
        origin_id: origin.id,
        load_set_blocks: {
          "0" => {
            name: "batch-response-block",
            separator: ",",
            compound_type_id: compound_type.id,
            data: Rack::Test::UploadedFile.new(csv_file.path, "text/csv")
          }
        }
      }

      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy
      expect(response_data.keys).to include("data")
      expect(response_data["data"].keys).to include("id")
      expect(response_data["data"].keys).to include("entity")
      expect(response_data["data"]["entity"]).to eq("Grit::Compounds::Batch")

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-batch-response")
      load_set_block = load_set.load_set_blocks.order(:id).first

      # Test initialize_data response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy
      expect(response_data["data"].keys).to include("id")

      # Test validate response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_0" },
          "compound_id" => { "header" => "col_1", "find_by" => "number" },
          "origin_id" => { "constant" => true, "value" => origin.id }
        }
      }
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy

      # Test confirm response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      response_data = JSON.parse(response.body)
      expect(response_data["success"]).to be_truthy
      expect(response_data["data"].keys).to include("id")
      expect(response_data["data"].keys).to include("status_id")

      csv_file.close
      csv_file.unlink
    end
  end
end
