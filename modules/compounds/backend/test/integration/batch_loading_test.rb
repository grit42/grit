require "test_helper"

module Grit::Compounds
  class BatchLoadingTest < ActionDispatch::IntegrationTest
    include Authlogic::TestCase
    self.use_transactional_tests = false

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @origin = grit_core_origins(:one)
      @compound_type = grit_compounds_compound_types(:screening)
      @compound = grit_compounds_compounds(:one)
    end

    # Test 1: Full batch loading workflow
    test "full CSV batch loading workflow creates batch linked to compound" do
      # Create a CSV file dynamically for batch loading
      # Use compound number for lookup (not ID) - this matches how the loader works
      csv_content = "name,compound_number\nbatch-001,#{@compound.number}"
      csv_file = Tempfile.new([ "batch_test", ".csv" ])
      csv_file.write(csv_content)
      csv_file.rewind

      post "/api/grit/core/load_sets", params: {
        name: "integration-test-batch-load",
        entity: "Grit::Compounds::Batch",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "batch-block",
            separator: ",",
            compound_type_id: @compound_type.id,
            data: Rack::Test::UploadedFile.new(csv_file.path, "text/csv")
          }
        }
      }

      assert_response :created
      response_data = JSON.parse(response.body)
      assert response_data["success"]

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-batch-load")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      assert_response :success

      # Use find_by to tell the loader how to look up the compound
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_0" },
          "compound_id" => { "header" => "col_1", "find_by" => "number" },
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }
      assert_response :success

      assert_difference("Grit::Compounds::Batch.count") do
        post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      end
      assert_response :success

      # Verify batch linked correctly
      batch = Grit::Compounds::Batch.order(:id).last
      assert_equal @compound.id, batch.compound_id
      assert_equal @compound_type.id, batch.compound_type_id
      assert_equal @origin.id, batch.origin_id

      csv_file.close
      csv_file.unlink
    end

    # Test 2: Batch loading with invalid compound reference
    test "batch loading with invalid compound_id shows validation error" do
      csv_content = "name,compound_number\nbatch-invalid,NONEXISTENT_COMPOUND"
      csv_file = Tempfile.new([ "batch_invalid", ".csv" ])
      csv_file.write(csv_content)
      csv_file.rewind

      post "/api/grit/core/load_sets", params: {
        name: "integration-test-batch-invalid",
        entity: "Grit::Compounds::Batch",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "batch-invalid-block",
            separator: ",",
            compound_type_id: @compound_type.id,
            data: Rack::Test::UploadedFile.new(csv_file.path, "text/csv")
          }
        }
      }
      assert_response :created

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-batch-invalid")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      assert_response :success

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_0" },
          "compound_id" => { "header" => "col_1", "find_by" => "number" },
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }

      # Validation should fail due to invalid compound reference
      response_data = JSON.parse(response.body)
      assert_not response_data["success"]

      load_set_block.reload
      assert load_set_block.has_errors

      csv_file.close
      csv_file.unlink
    end

    # Test 3: Batch rollback removes batch records
    test "batch rollback removes created batch" do
      csv_content = "name,compound_number\nbatch-rollback,#{@compound.number}"
      csv_file = Tempfile.new([ "batch_rollback", ".csv" ])
      csv_file.write(csv_content)
      csv_file.rewind

      post "/api/grit/core/load_sets", params: {
        name: "integration-test-batch-rollback",
        entity: "Grit::Compounds::Batch",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "batch-rollback-block",
            separator: ",",
            compound_type_id: @compound_type.id,
            data: Rack::Test::UploadedFile.new(csv_file.path, "text/csv")
          }
        }
      }
      assert_response :created

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-batch-rollback")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_0" },
          "compound_id" => { "header" => "col_1", "find_by" => "number" },
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      assert_response :success

      assert_difference("Grit::Compounds::Batch.count", -1) do
        post "/api/grit/core/load_set_blocks/#{load_set_block.id}/rollback"
      end
      assert_response :success

      response_data = JSON.parse(response.body)
      assert response_data["success"]

      csv_file.close
      csv_file.unlink
    end

    # Test 4: API response structure for batch loading
    test "batch loading API responses have correct structure" do
      csv_content = "name,compound_number\nbatch-response,#{@compound.number}"
      csv_file = Tempfile.new([ "batch_response", ".csv" ])
      csv_file.write(csv_content)
      csv_file.rewind

      post "/api/grit/core/load_sets", params: {
        name: "integration-test-batch-response",
        entity: "Grit::Compounds::Batch",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "batch-response-block",
            separator: ",",
            compound_type_id: @compound_type.id,
            data: Rack::Test::UploadedFile.new(csv_file.path, "text/csv")
          }
        }
      }

      response_data = JSON.parse(response.body)
      assert response_data["success"]
      assert_includes response_data.keys, "data"
      assert_includes response_data["data"].keys, "id"
      assert_includes response_data["data"].keys, "entity"
      assert_equal "Grit::Compounds::Batch", response_data["data"]["entity"]

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-batch-response")
      load_set_block = load_set.load_set_blocks.order(:id).first

      # Test initialize_data response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      response_data = JSON.parse(response.body)
      assert response_data["success"]
      assert_includes response_data["data"].keys, "id"

      # Test validate response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_0" },
          "compound_id" => { "header" => "col_1", "find_by" => "number" },
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }
      response_data = JSON.parse(response.body)
      Rails.logger.info "===================="
      Rails.logger.info response_data
      assert response_data["success"]

      # Test confirm response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      response_data = JSON.parse(response.body)
      assert response_data["success"]
      assert_includes response_data["data"].keys, "id"
      assert_includes response_data["data"].keys, "status_id"

      csv_file.close
      csv_file.unlink
    end
  end
end
