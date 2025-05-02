require "test_helper"

module Grit::Assays
  class AssayModelsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @assay_model = grit_assays_assay_models(:one)
    end

    test "should get index" do
      get assay_models_url, as: :json
      assert_response :success
    end

    test "should create assay_model" do
      assert_difference("AssayModel.count") do
        post assay_models_url, params: { assay_model: {} }, as: :json
      end

      assert_response :created
    end

    test "should show assay_model" do
      get assay_model_url(@assay_model), as: :json
      assert_response :success
    end

    test "should update assay_model" do
      patch assay_model_url(@assay_model), params: { assay_model: {} }, as: :json
      assert_response :success
    end

    test "should destroy assay_model" do
      assert_difference("AssayModel.count", -1) do
        delete assay_model_url(@assay_model), as: :json
      end

      assert_response :no_content
    end
  end
end
