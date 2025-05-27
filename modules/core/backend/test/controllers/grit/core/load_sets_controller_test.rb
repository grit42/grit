require "test_helper"

module Grit::Core
  class LoadSetsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @load_set = grit_core_load_sets(:test_entity_mapping)
    end

    test "should get index" do
      get load_sets_url, as: :json
      assert_response :success
    end

    test "should create load_set" do
      assert_difference("LoadSet.count") do
        post load_sets_url, params: {
          name: "test-entity-2",
          entity: "TestEntity",
          separator: ",",
          data: file_fixture_upload("test_entity.csv", "application/csv"),
          origin_id: 42
        }
      end

      assert_response :created
    end

    test "should show load_set" do
      get load_set_url(@load_set), as: :json
      assert_response :success
    end

    test "should update mapping load_set, validate and confirm" do
      post load_set_set_mappings_url(@load_set), params: {
        mappings: {
          name: {
            header: 0
          }
        }
      }, as: :json

      assert_response :success

      post load_set_validate_url(@load_set), as: :json

      assert_response :success

      assert_difference("TestEntity.count", 2) do
        post load_set_confirm_url(@load_set), as: :json
      end
    end

    test "should update load_set and fail to validate missing required" do
      @load_set = grit_core_load_sets(:test_entity_missing_required)

      post load_set_set_mappings_url(@load_set), params: {
        mappings: {
          name: {
            header: 0
          }
        }
      }, as: :json

      assert_response :success

      post load_set_validate_url(@load_set), as: :json

      assert_response :unprocessable_entity

      # errors = JSON.parse(@response.body)["errors"]

      assert Grit::Core::LoadSet.find(@load_set.id).record_errors[0]["errors"]["name"][0] == "can't be blank"
    end

    test "should update load_set and fail to validate not a number" do
      @load_set = grit_core_load_sets(:test_entity_wrong_data)
      post load_set_set_mappings_url(@load_set), params: {
        mappings: {
          name: {
            header: 0
          },
          integer: {
            header: 1
          }
        }
      }, as: :json

      assert_response :success

      post load_set_validate_url(@load_set), as: :json

      assert_response :unprocessable_entity

      assert Grit::Core::LoadSet.find(@load_set.id).record_errors[0]["errors"]["integer"][0] == "is not a number"
    end

    test "should update load_set and fail to validate not an ISO date" do
      @load_set = grit_core_load_sets(:test_entity_wrong_data)
      post load_set_set_mappings_url(@load_set), params: {
        mappings: {
          name: {
            header: 0
          },
          date: {
            header: 1
          }
        }
      }, as: :json

      assert_response :success

      post load_set_validate_url(@load_set), as: :json

      assert_response :unprocessable_entity

      assert Grit::Core::LoadSet.find(@load_set.id).record_errors[0]["errors"]["date"][0] == "Unable to parse date, please use YYYY/MM/DD or ISO 8601"
    end

    test "should update load_set and fail to validate not an ISO datetime" do
      @load_set = grit_core_load_sets(:test_entity_wrong_data)
      post load_set_set_mappings_url(@load_set), params: {
        mappings: {
          name: {
            header: 0
          },
          datetime: {
            header: 1
          }
        }
      }, as: :json

      assert_response :success

      post load_set_validate_url(@load_set), as: :json

      assert_response :unprocessable_entity

      assert Grit::Core::LoadSet.find(@load_set.id).record_errors[0]["errors"]["datetime"][0] == "Unable to parse datetime, please use YYYY/MM/DD HH:mm:ss or ISO 8601"
    end

    test "should not destroy succeeded load_set" do
      @load_set = grit_core_load_sets(:test_entity_succeeded)
      assert_no_difference("LoadSet.count") do
        delete load_set_url(@load_set), as: :json
      end

      assert_response :forbidden
    end

    test "should rollback and destroy load_set" do
      @load_set = grit_core_load_sets(:test_entity_succeeded)
      assert_difference("TestEntity.count", -2) do
        post load_set_rollback_url(@load_set)
      end

      assert_response :success

      assert_difference("LoadSet.count", -1) do
        delete load_set_url(@load_set), as: :json
      end

      assert_response :success
    end
  end
end
