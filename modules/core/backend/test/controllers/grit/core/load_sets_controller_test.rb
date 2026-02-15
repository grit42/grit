require "test_helper"

module Grit::Core
  class LoadSetsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @load_set = grit_core_load_sets(:test_entity_mapping)
      @load_set_block = grit_core_load_set_blocks(:test_entity_mapping_block)
    end

    test "should get index" do
      get load_sets_url, as: :json
      assert_response :success
    end

    test "should create load_set with load_set_blocks" do
      assert_difference("LoadSet.count") do
        assert_difference("LoadSetBlock.count") do
          post load_sets_url, params: {
            name: "test-entity-new",
            entity: "TestEntity",
            origin_id: grit_core_origins(:one).id,
            load_set_blocks: {
              "0" => {
                name: "test-block",
                separator: ",",
                data: fixture_file_upload("test_entity.csv", "text/csv")
              }
            }
          }
        end
      end

      assert_response :created
    end

    test "should show load_set" do
      get load_set_url(@load_set), as: :json
      assert_response :success

      data = JSON.parse(response.body)["data"]
      assert_equal @load_set.name, data["name"]
      assert_includes data.keys, "load_set_blocks"
    end

    test "should not destroy succeeded load_set" do
      @load_set = grit_core_load_sets(:test_entity_succeeded)
      assert_no_difference("LoadSet.count") do
        delete load_set_url(@load_set), as: :json
      end

      assert_response :forbidden
      assert_includes JSON.parse(response.body)["errors"], "it must be undone first"
    end

    test "should destroy load_set without succeeded blocks" do
      # Create a fresh load set without succeeded blocks
      post load_sets_url, params: {
        name: "test-entity-to-delete",
        entity: "TestEntity",
        origin_id: grit_core_origins(:one).id,
        load_set_blocks: {
          "0" => {
            name: "test-block",
            separator: ",",
            data: fixture_file_upload("test_entity.csv", "text/csv")
          }
        }
      }
      assert_response :created

      created_load_set = LoadSet.find_by(name: "test-entity-to-delete")

      assert_difference("LoadSet.count", -1) do
        delete load_set_url(created_load_set), as: :json
      end

      assert_response :success
    end

    test "should rollback load_set and then destroy" do
      @load_set = grit_core_load_sets(:test_entity_succeeded)

      # Rollback should succeed and change TestEntity count
      assert_difference("TestEntity.count", -2) do
        post load_set_rollback_url(@load_set), as: :json
      end

      assert_response :success

      # After rollback, blocks are no longer in "Succeeded" status, so destroy should work
      assert_difference("LoadSet.count", -1) do
        delete load_set_url(@load_set), as: :json
      end

      assert_response :success
    end
  end
end
