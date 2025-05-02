require "test_helper"

module Grit::Core
  class LoadSetStatusesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @load_set_status = grit_core_load_set_statuses(:mapping)
    end

    test "should get index" do
      get countries_url, as: :json
      assert_response :success
    end

    test "should not create load_set_status" do
      assert_no_difference("LoadSetStatus.count") do
        post countries_url, params: { name: "Test", description: "Test status" }, as: :json
      end

      assert_response :forbidden
    end

    test "should show load_set_status" do
      get load_set_status_url(@load_set_status), as: :json
      assert_response :success
    end

    test "should not update load_set_status" do
      patch load_set_status_url(@load_set_status), params: { name: "Testtest" }, as: :json
      assert_response :forbidden
    end

    test "should not destroy load_set_status" do
      assert_no_difference("LoadSetStatus.count") do
        delete load_set_status_url(@load_set_status), as: :json
      end

      assert_response :forbidden
    end
  end
end
