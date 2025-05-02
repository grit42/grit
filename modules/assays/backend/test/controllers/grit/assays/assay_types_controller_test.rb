require "test_helper"

module Grit::Assays
  class AssayTypesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @assay_type = grit_assays_assay_types(:one)
    end

    test "should get index" do
      get assay_types_url, as: :json
      assert_response :success
    end

    test "should create assay_type" do
      assert_difference("AssayType.count") do
        post assay_types_url, params: { assay_type: {} }, as: :json
      end

      assert_response :created
    end

    test "should show assay_type" do
      get assay_type_url(@assay_type), as: :json
      assert_response :success
    end

    test "should update assay_type" do
      patch assay_type_url(@assay_type), params: { assay_type: {} }, as: :json
      assert_response :success
    end

    test "should destroy assay_type" do
      assert_difference("AssayType.count", -1) do
        delete assay_type_url(@assay_type), as: :json
      end

      assert_response :no_content
    end
  end
end
