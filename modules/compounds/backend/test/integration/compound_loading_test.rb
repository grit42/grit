require "test_helper"

module Grit::Compounds
  class CompoundLoadingTest < ActionDispatch::IntegrationTest
    include Authlogic::TestCase
    self.use_transactional_tests = false

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @origin = grit_core_origins(:one)
      @compound_type = grit_compounds_compound_types(:screening)
    end

    # Test 1: Full SDF workflow - create, initialize, validate, confirm
    test "full SDF compound loading workflow creates compound and molecule" do
      # Create LoadSet with SDF file
      assert_difference("Grit::Core::LoadSet.count") do
        post "/api/grit/core/load_sets", params: {
          name: "integration-test-compound-load",
          entity: "Grit::Compounds::Compound",
          origin_id: @origin.id,
          load_set_blocks: {
            "0" => {
              name: "sdf-block",
              separator: "$$$$",
              compound_type_id: @compound_type.id,
              structure_format: "molfile",
              data: fixture_file_upload("simple_integration.sdf", "chemical/x-mdl-sdfile")
            }
          }
        }
      end

      assert_response :created
      response_data = JSON.parse(response.body)
      assert response_data["success"]

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-compound-load")
      load_set_block = load_set.load_set_blocks.order(:id).first

      # Initialize data (parses SDF, creates tables)
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      assert_response :success

      Rails.logger.info load_set_block.raw_data_klass.all

      # Validate with mappings
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_1" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }
      assert_response :success
      response_data = JSON.parse(response.body)
      assert response_data["success"]

      # Confirm and verify records created
      compound_count_before = Grit::Compounds::Compound.count
      molecules_compound_count_before = Grit::Compounds::MoleculesCompound.count
      molecule_count_before = Grit::Compounds::Molecule.count

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      assert_response :success
      response_data = JSON.parse(response.body)
      assert response_data["success"]


      assert_equal compound_count_before + 1, Grit::Compounds::Compound.count
      assert_equal molecules_compound_count_before + 1, Grit::Compounds::MoleculesCompound.count

      # Verify the compound was created correctly
      compound = Grit::Compounds::Compound.order(:id).last
      assert_equal @compound_type.id, compound.compound_type_id
      assert_equal @origin.id, compound.origin_id
    end

    # Test 2: Multiple molecules in one SDF file
    test "SDF with multiple molecules creates multiple compounds" do
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-multiple",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "multi-block",
            separator: "$$$$",
            compound_type_id: @compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload("multiple.sdf", "chemical/x-mdl-sdfile")
          }
        }
      }
      assert_response :created

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-multiple")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      assert_response :success

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_1" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }
      assert_response :success

      assert_difference([ "Grit::Compounds::Compound.count", "Grit::Compounds::MoleculesCompound.count" ], 2) do
        post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      end
      assert_response :success
    end

    # Test 3: Loading compound with existing molecule links to existing molecule
    test "loading compound with existing molecule links to existing molecule without duplication" do
      Grit::Compounds::MoleculesCompound.destroy_all
      Grit::Compounds::Molecule.destroy_all
      Grit::Compounds::Batch.destroy_all
      Grit::Compounds::Compound.destroy_all
      # First load: create a compound with a molecule
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-first-load",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "first-block",
            separator: "$$$$",
            compound_type_id: @compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload("simple.sdf", "chemical/x-mdl-sdfile")
          }
        }
      }
      assert_response :created

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-first-load")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_1" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      assert_response :success

      first_molecule = Grit::Compounds::Molecule.order(:id).last
      molecule_count_after_first = Grit::Compounds::Molecule.count

      # Second load: same structure should link to existing molecule
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-second-load",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "second-block",
            separator: "$$$$",
            compound_type_id: @compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload("simple.sdf", "chemical/x-mdl-sdfile")
          }
        }
      }
      assert_response :created

      load_set2 = Grit::Core::LoadSet.find_by(name: "integration-test-second-load")
      load_set_block2 = load_set2.load_set_blocks.first

      post "/api/grit/core/load_set_blocks/#{load_set_block2.id}/initialize_data"

      # Validation should show warning about existing molecule
      post "/api/grit/core/load_set_blocks/#{load_set_block2.id}/validate", params: {
        mappings: {
          "name" => { "constant" => true, "value" => "dup_mol" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }
      assert_response :success

      load_set_block2.reload
      assert load_set_block2.has_warnings, "Should have warnings about existing molecule"

      # Confirm - should create new compound but NOT new molecule
      assert_difference("Grit::Compounds::Compound.count", 1) do
        assert_no_difference("Grit::Compounds::Molecule.count") do
          post "/api/grit/core/load_set_blocks/#{load_set_block2.id}/confirm"
        end
      end
      assert_response :success

      # Verify the new compound is linked to the existing molecule
      new_compound = Grit::Compounds::Compound.order(:id).last
      molecules_compound = Grit::Compounds::MoleculesCompound.find_by(compound_id: new_compound.id)
      assert_equal first_molecule.id, molecules_compound.molecule_id
    end

    # Test 4: Invalid structure format causes validation error
    test "invalid molfile structure causes validation error" do
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-malformed",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "malformed-block",
            separator: "$$$$",
            compound_type_id: @compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload("malformed.sdf", "chemical/x-mdl-sdfile")
          }
        }
      }
      assert_response :created

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-malformed")
      load_set_block = load_set.load_set_blocks.order(:id).first

      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"

      # Should return error response
      response_data = JSON.parse(response.body)
      assert_not response_data["success"]

      load_set_block.reload
      assert load_set_block.error
    end

    # Test 5: Rollback removes all created records
    test "rollback removes compound molecule and link records" do
      # Create and confirm a load
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-rollback",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "rollback-block",
            separator: "$$$$",
            compound_type_id: @compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload("simple.sdf", "chemical/x-mdl-sdfile")
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
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      assert_response :success

      # Rollback
      assert_difference("Grit::Compounds::Compound.count", -1) do
        assert_difference("Grit::Compounds::Molecule.count", -1) do
          assert_difference("Grit::Compounds::MoleculesCompound.count", -1) do
            post "/api/grit/core/load_set_blocks/#{load_set_block.id}/rollback"
          end
        end
      end

      assert_response :success
      response_data = JSON.parse(response.body)
      assert response_data["success"]
    end

    # Test 6: API response format verification
    test "API responses have correct JSON structure" do
      post "/api/grit/core/load_sets", params: {
        name: "integration-test-response",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "response-block",
            separator: "$$$$",
            compound_type_id: @compound_type.id,
            structure_format: "molfile",
            data: fixture_file_upload("simple.sdf", "chemical/x-mdl-sdfile")
          }
        }
      }

      response_data = JSON.parse(response.body)
      assert_includes response_data.keys, "success"
      assert_includes response_data.keys, "data"
      assert response_data["success"]

      # Verify data structure
      data = response_data["data"]
      assert_includes data.keys, "id"
      assert_includes data.keys, "name"
      assert_includes data.keys, "entity"
      assert_equal "Grit::Compounds::Compound", data["entity"]

      load_set = Grit::Core::LoadSet.find_by(name: "integration-test-response")
      load_set_block = load_set.load_set_blocks.order(:id).first

      # Test initialize_data response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/initialize_data"
      response_data = JSON.parse(response.body)
      assert response_data["success"]
      assert_includes response_data["data"].keys, "id"
      assert_includes response_data["data"].keys, "status_id"

      # Test validate response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/validate", params: {
        mappings: {
          "name" => { "header" => "col_1" },
          "molecule" => { "header" => "col_0" },
          "origin_id" => { "constant" => true, "value" => @origin.id }
        }
      }
      response_data = JSON.parse(response.body)
      assert response_data["success"]
      assert_includes response_data["data"].keys, "id"

      # Test confirm response
      post "/api/grit/core/load_set_blocks/#{load_set_block.id}/confirm"
      response_data = JSON.parse(response.body)
      assert response_data["success"]
      assert_includes response_data["data"].keys, "id"
    end
  end
end
