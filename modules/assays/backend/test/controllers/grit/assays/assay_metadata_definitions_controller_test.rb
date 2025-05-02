require "test_helper"

module Grit::Assays
  class AssayMetadataDefinitionsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @assay_metadata_definition = grit_assays_assay_metadata_definitions(:one)
    end

    test "should get index" do
      get assay_metadata_definitions_url, as: :json
      assert_response :success
    end

    test "should create assay_metadata_definition" do
      assert_difference("AssayMetadataDefinition.count") do
        post assay_metadata_definitions_url, params: { assay_metadata_definition: {} }, as: :json
      end

      assert_response :created
    end

    test "should show assay_metadata_definition" do
      get assay_metadata_definition_url(@assay_metadata_definition), as: :json
      assert_response :success
    end

    test "should update assay_metadata_definition" do
      patch assay_metadata_definition_url(@assay_metadata_definition), params: { assay_metadata_definition: {} }, as: :json
      assert_response :success
    end

    test "should destroy assay_metadata_definition" do
      assert_difference("AssayMetadataDefinition.count", -1) do
        delete assay_metadata_definition_url(@assay_metadata_definition), as: :json
      end

      assert_response :no_content
    end
  end
end
