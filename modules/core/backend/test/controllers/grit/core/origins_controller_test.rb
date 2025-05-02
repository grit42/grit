require "test_helper"

module Grit::Core
  class OriginsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @origin = grit_core_origins(:two)
    end

    test "should get index" do
      get origins_url, as: :json
      assert_response :success
    end

    test "should create origin" do
      assert_difference("Origin.count") do
        post origins_url, params: { name: "TESTTEST", domain: "Testtest domain", status: "Testtest status" }, as: :json
      end

      assert_response :created
    end

    test "should not create origin" do
      login(grit_core_users(:notadmin))

      assert_no_difference("Origin.count") do
        post origins_url, params: { name: "TESTTEST", domain: "Testtest domain", status: "Testtest status" }, as: :json
      end

      assert_response :forbidden
    end

    test "should show origin" do
      get origin_url(@origin), as: :json
      assert_response :success
    end

    test "should update origin" do
      patch origin_url(@origin), params: { name: "TESTTESTTEST" }, as: :json
      assert_response :success
    end

    test "should not update origin" do
      login(grit_core_users(:notadmin))

      patch origin_url(@origin), params: { name: "TESTTESTTEST" }, as: :json
      assert_response :forbidden
    end

    test "should destroy origin" do
      assert_difference("Origin.count", -1) do
        delete origin_url(@origin), as: :json
      end

      assert_response :success
    end
  end
end
