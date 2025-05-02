require "test_helper"

module Grit::Assays
  class AssaysControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @assay = grit_assays_assays(:one)
    end

    test "should get index" do
      get assays_url, as: :json
      assert_response :success
    end

    test "should create assay" do
      assert_difference("Assay.count") do
        post assays_url, params: { assay: {} }, as: :json
      end

      assert_response :created
    end

    test "should show assay" do
      get assay_url(@assay), as: :json
      assert_response :success
    end

    test "should update assay" do
      patch assay_url(@assay), params: { assay: {} }, as: :json
      assert_response :success
    end

    test "should destroy assay" do
      assert_difference("Assay.count", -1) do
        delete assay_url(@assay), as: :json
      end

      assert_response :no_content
    end
  end
end
