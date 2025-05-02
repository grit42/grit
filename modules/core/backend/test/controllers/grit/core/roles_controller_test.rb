require "test_helper"

module Grit::Core
  class RolesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @role = grit_core_roles(:one)
    end

    test "should get index" do
      get roles_url, as: :json
      assert_response :success
    end

    test "should not create role" do
      assert_no_difference("Role.count") do
        post roles_url, params: { name: "Test", description: "Test role" }, as: :json
      end

      assert_response :forbidden
    end

    test "should show role" do
      get role_url(@role), as: :json
      assert_response :success
    end

    test "should not update role" do
      patch role_url(@role), params: { name: "Updated role" }, as: :json
      assert_response :forbidden
    end

    test "should not destroy role" do
      assert_no_difference("Role.count") do
        delete role_url(@role), as: :json
      end

      assert_response :forbidden
    end
  end
end
