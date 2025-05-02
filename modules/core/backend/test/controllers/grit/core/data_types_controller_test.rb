require "test_helper"

module Grit::Core
  class DataTypesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @data_type = grit_core_data_types(:integer)
    end

    test "anyone should get index" do
      login(grit_core_users(:notadmin))
      get data_types_url, as: :json
      assert_response :success
    end

    test "should not create data_type" do
      assert_no_difference("DataType.count") do
        post data_types_url, params: { name: "test" }, as: :json
      end

      assert_response :forbidden
    end

    test "anyone should show data_type" do
      login(grit_core_users(:notadmin))
      get data_type_url(@data_type), as: :json
      assert_response :success
    end

    test "should not update data_type" do
      patch data_type_url(@data_type), params: { name: "test" }, as: :json
      assert_response :forbidden
    end

    test "should not destroy data_type" do
      assert_no_difference("DataType.count", -1) do
        delete data_type_url(@data_type), as: :json
      end

      assert_response :forbidden
    end
  end
end
