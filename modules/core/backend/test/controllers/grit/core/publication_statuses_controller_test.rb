require "test_helper"

module Grit::Core
  class PublicationStatusesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @publication_status = grit_core_publication_statuses(:draft)
    end

    test "should get index" do
      get publication_statuses_url, as: :json
      assert_response :success
    end

    test "should create publication_status" do
      assert_no_difference("PublicationStatus.count") do
        post publication_statuses_url, params: { name: "nope" }, as: :json
      end

      assert_response :forbidden
    end

    test "should show publication_status" do
      get publication_status_url(@publication_status), as: :json
      assert_response :success
    end

    test "should update publication_status" do
      patch publication_status_url(@publication_status), params: { name: "nope" }, as: :json
      assert_response :forbidden
    end

    test "should destroy publication_status" do
      assert_difference("PublicationStatus.count", 0) do
        delete publication_status_url(@publication_status), as: :json
      end

      assert_response :forbidden
    end
  end
end
