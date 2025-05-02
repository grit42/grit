require "test_helper"

module Grit::Core
  class LocationsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @location = grit_core_locations(:one)
    end

    test "should get index" do
      get locations_url, as: :json
      assert_response :success
    end

    test "should create location" do
      assert_difference("Location.count") do
        post locations_url, params: {
          name: "Test location",
          print_address: "42, somestreet, 4242 Someplace, Somecountry",
          country_id: 42,
          origin_id: 1
        }, as: :json
      end

      assert_response :created
    end

    test "should not create location" do
      login(grit_core_users(:notadmin))

      assert_no_difference("Location.count") do
        post locations_url, params: {
          name: "Test location 2",
          print_address: "84, somestreet, 8484 Someplace, Somecountry",
          country_id: 42,
          origin_id: 1
        }, as: :json
      end

      assert_response :forbidden
    end

    test "should show location" do
      get location_url(@location), as: :json
      assert_response :success
    end

    test "should update location" do
      patch location_url(@location), params: { name: "Another name for this test location" }, as: :json
      assert_response :success
    end

    test "should not update location" do
      login(grit_core_users(:notadmin))

      patch location_url(@location), params: { name: "Another name for this test location" }, as: :json
      assert_response :forbidden
    end

    test "should destroy location" do
      assert_difference("Location.count", -1) do
        delete location_url(@location), as: :json
      end

      assert_response :success
    end
  end
end
