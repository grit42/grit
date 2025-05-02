require "test_helper"

module Grit::Core
  class PublicationStatusesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @publication_status = grit_core_publication_statuses(:one)
    end

    test "should get index" do
      get publication_statuses_url, as: :json
      assert_response :success
    end

    test "should create publication_status" do
      assert_difference("PublicationStatus.count") do
        post publication_statuses_url, params: { publication_status: {} }, as: :json
      end

      assert_response :created
    end

    test "should show publication_status" do
      get publication_status_url(@publication_status), as: :json
      assert_response :success
    end

    test "should update publication_status" do
      patch publication_status_url(@publication_status), params: { publication_status: {} }, as: :json
      assert_response :success
    end

    test "should destroy publication_status" do
      assert_difference("PublicationStatus.count", -1) do
        delete publication_status_url(@publication_status), as: :json
      end

      assert_response :no_content
    end
  end
end
