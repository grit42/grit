require "test_helper"

module Grit::Core
  class UnitsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      @unit = grit_core_units(:one)
    end

    test "anyone should get index" do
      login(grit_core_users(:notadmin))
      get units_url, as: :json
      assert_response :success
    end

    test "anyone should not create unit" do
      login(grit_core_users(:notadmin))
      assert_no_difference("Unit.count") do
        post units_url, params: { name: "test", abbreviation: "test" }, as: :json
      end

      assert_response :forbidden
    end

    test "admin should create unit" do
      login(grit_core_users(:admin))
      assert_difference("Unit.count") do
        post units_url, params: { name: "test", abbreviation: "test" }, as: :json
      end

      assert_response :success
    end

    test "anyone should show unit" do
      login(grit_core_users(:notadmin))
      get unit_url(@unit), as: :json
      assert_response :success
    end

    test "anyone should not update unit" do
      login(grit_core_users(:notadmin))
      patch unit_url(@unit), params: { name: "test" }, as: :json
      assert_response :forbidden
    end

    test "admin should update unit" do
      login(grit_core_users(:admin))
      patch unit_url(@unit), params: { name: "test" }, as: :json
      assert_response :success
    end

    test "anyone should not destroy unit" do
      login(grit_core_users(:notadmin))
      assert_no_difference("Unit.count") do
        delete unit_url(@unit), as: :json
      end

      assert_response :forbidden
    end

    test "admin should destroy unit" do
      login(grit_core_users(:admin))
      assert_difference("Unit.count", -1) do
        delete unit_url(@unit), as: :json
      end

      assert_response :success
    end
  end
end
