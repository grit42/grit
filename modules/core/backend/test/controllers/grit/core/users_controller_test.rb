require "test_helper"

module Grit::Core
  class UsersControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))

      @user = grit_core_users(:notadmin)
    end

    test "anyone should get index" do
      login(grit_core_users(:notadmin))
      get users_url
      assert_response :success
    end

    test "admin should get index for user admin" do
      get users_url, params: "scope=user_administration"
      assert_response :success
    end

    test "not admin should not get index for user admin" do
      login(grit_core_users(:notadmin))
      get users_url, params: "scope=user_administration"
      assert_response :bad_request
    end

    test "should create and activate user" do
      assert_difference("User.count") do
        post users_url, params: {
          login: "test",
          name: "Test",
          email: "test@example.com",
          origin_id: 42,
          active: false,
          two_factor: false,
          role_ids: []
         }, as: :json
      end

      assert_response :created

      res = JSON.parse(@response.body)
      new_user_id = res["data"]["id"]
      new_user = Grit::Core::User.find(new_user_id)
      login(new_user)

      assert_response :unauthorized

      post activate_user_url, params: {
        activation_token: new_user.activation_token,
        password: "password",
        password_confirmation: "password"
      }

      assert_response :success

      login(new_user)

      assert_response :success
    end

    test "anyone should show user" do
      login(grit_core_users(:notadmin))
      get user_url(@user)
      assert_response :success
    end

    test "admin should show user for user admin" do
      get user_url(@user), params: "scope=user_administration"
      assert_response :success
    end

    test "not admin should not show user for user admin" do
      login(grit_core_users(:notadmin))
      get user_url(@user), params: "scope=user_administration"
      assert_response :bad_request
    end


    test "admin should update user" do
      patch user_url(@user), params: { user: "Your name is waaat" }, as: :json
      assert_response :success
    end

    test "not admin should not update user" do
      login(grit_core_users(:notadmin))
      @user = grit_core_users(:admin)
      patch user_url(@user), params: { name: "Administratoz" }, as: :json
      assert_response :forbidden
    end

    test "self should update info" do
      login(grit_core_users(:notadmin))
      post update_info_user_url, params: { name: "My name is waaat" }, as: :json
      assert_response :success
    end

    test "self should update settings" do
      login(grit_core_users(:notadmin))
      post update_settings_user_url, params: { settings: { theme: "dark" } }, as: :json
      assert_response :success
    end

    test "should reset password" do
      post request_password_reset_user_url, params: { user: "admin@example.com" }, as: :json

      assert_response :success

      @user = Grit::Core::User.find_by(email: "admin@example.com")

      post password_reset_user_url, params: { forgot_token: @user.forgot_token, password: "testtest", password_confirmation: "testtest" }, as: :json

      assert_response :success

      login(@user, "testtest")

      assert_response :success
    end

    test "should update password" do
      login(@user)

      post update_password_user_url, params: { old_password: "password", password: "testtest", password_confirmation: "testtest" }, as: :json

      assert_response :success

      login(@user, "testtest")

      assert_response :success
    end

    test "admin should destroy user" do
      assert_difference("User.count", -1) do
        delete user_url(@user), as: :json
      end

      assert_response :success
    end

    test "anyone should not destroy user" do
      login(@user)

      assert_no_difference("User.count") do
        delete user_url(@user), as: :json
      end

      assert_response :forbidden
    end

    test "user should be disabled after 50 wrong password attempts" do
      login_attempts = Grit::Core::UserSession.consecutive_failed_logins_limit + 1
      login_attempts.times {
        login(@user, "wrongpassword")
      }
      @user_record = Grit::Core::User.find_by(login: "notadmin")
      assert @user_record.active == false
    end

    test "user should pull an API token" do
      login(@user)

      post generate_api_token_user_url
      assert_response :success
    end

    test "user should revoke an API token" do
      login(@user)

      post revoke_api_token_user_url
      assert_response :success
    end

    test "user should be allowed access with valid token" do
      logout

      @user_record = Grit::Core::User.find_by(login: "notadmin")
      get hello_world_api_user_url + "?user_credentials=" + @user_record.single_access_token
      assert_response :success

      get hello_world_api_user_url + "?user_credentials=" + "nottherightapitoken"
      assert_response :unauthorized
    end
  end
end
