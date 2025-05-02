require "test_helper"

module Grit::Assays
  class AssayMetadataControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @assay_metadatum = grit_assays_assay_metadata(:one)
    end

    test "should get index" do
      get assay_metadata_url, as: :json
      assert_response :success
    end

    test "should create assay_metadatum" do
      assert_difference("AssayMetadatum.count") do
        post assay_metadata_url, params: { assay_metadatum: {} }, as: :json
      end

      assert_response :created
    end

    test "should show assay_metadatum" do
      get assay_metadatum_url(@assay_metadatum), as: :json
      assert_response :success
    end

    test "should update assay_metadatum" do
      patch assay_metadatum_url(@assay_metadatum), params: { assay_metadatum: {} }, as: :json
      assert_response :success
    end

    test "should destroy assay_metadatum" do
      assert_difference("AssayMetadatum.count", -1) do
        delete assay_metadatum_url(@assay_metadatum), as: :json
      end

      assert_response :no_content
    end
  end
end
