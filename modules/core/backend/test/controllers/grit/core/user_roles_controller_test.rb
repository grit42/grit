require "test_helper"

module Grit::Core
  class UserRolesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @user_role = grit_core_user_roles(:one)
    end

    test "should not get index" do
      get user_roles_url, as: :json
      assert_response :forbidden
    end

    test "should not create user_role" do
      assert_no_difference("UserRole.count") do
        post user_roles_url, params: { user_id: 1, role_id: 43 }, as: :json
      end

      assert_response :forbidden
    end

    test "should not show user_role" do
      get user_role_url(@user_role), as: :json
      assert_response :forbidden
    end

    test "should not update user_role" do
      patch user_role_url(@user_role), params: { user_id: 42 }, as: :json
      assert_response :forbidden
    end

    test "should not destroy user_role" do
      assert_no_difference("UserRole.count") do
        delete user_role_url(@user_role), as: :json
      end

      assert_response :forbidden
    end
  end
end
