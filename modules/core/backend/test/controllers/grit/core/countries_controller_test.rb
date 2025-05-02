require "test_helper"

module Grit::Core
  class CountriesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @country = grit_core_countries(:one)
    end

    test "should get index" do
      get countries_url, as: :json
      assert_response :success
    end

    test "should not create country" do
      assert_no_difference("Country.count") do
        post countries_url, params: { name: "Yop", iso: "YP" }, as: :json
      end

      assert_response :forbidden
    end

    test "should show country" do
      get country_url(@country), as: :json
      assert_response :success
    end

    test "should not update country" do
      patch country_url(@country), params: { name: "Testtest" }, as: :json
      assert_response :forbidden
    end

    test "should not destroy country" do
      assert_no_difference("Country.count") do
        delete country_url(@country), as: :json
      end

      assert_response :forbidden
    end
  end
end
