require "test_helper"

module Grit::Assays
  class AssayModelMetadataControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @assay_model_metadatum = grit_assays_assay_model_metadata(:one)
    end

    test "should get index" do
      get assay_model_metadata_url, as: :json
      assert_response :success
    end

    test "should create assay_model_metadatum" do
      assert_difference("AssayModelMetadatum.count") do
        post assay_model_metadata_url, params: { assay_model_metadatum: {} }, as: :json
      end

      assert_response :created
    end

    test "should show assay_model_metadatum" do
      get assay_model_metadatum_url(@assay_model_metadatum), as: :json
      assert_response :success
    end

    test "should update assay_model_metadatum" do
      patch assay_model_metadatum_url(@assay_model_metadatum), params: { assay_model_metadatum: {} }, as: :json
      assert_response :success
    end

    test "should destroy assay_model_metadatum" do
      assert_difference("AssayModelMetadatum.count", -1) do
        delete assay_model_metadatum_url(@assay_model_metadatum), as: :json
      end

      assert_response :no_content
    end
  end
end
