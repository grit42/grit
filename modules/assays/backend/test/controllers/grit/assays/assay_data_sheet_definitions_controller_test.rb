require "test_helper"

module Grit::Assays
  class AssayDataSheetDefinitionsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @assay_data_sheet_definition = grit_assays_assay_data_sheet_definitions(:one)
    end

    test "should get index" do
      get assay_data_sheet_definitions_url, as: :json
      assert_response :success
    end

    test "should create assay_data_sheet_definition" do
      assert_difference("AssayDataSheetDefinition.count") do
        post assay_data_sheet_definitions_url, params: { assay_data_sheet_definition: {} }, as: :json
      end

      assert_response :created
    end

    test "should show assay_data_sheet_definition" do
      get assay_data_sheet_definition_url(@assay_data_sheet_definition), as: :json
      assert_response :success
    end

    test "should update assay_data_sheet_definition" do
      patch assay_data_sheet_definition_url(@assay_data_sheet_definition), params: { assay_data_sheet_definition: {} }, as: :json
      assert_response :success
    end

    test "should destroy assay_data_sheet_definition" do
      assert_difference("AssayDataSheetDefinition.count", -1) do
        delete assay_data_sheet_definition_url(@assay_data_sheet_definition), as: :json
      end

      assert_response :no_content
    end
  end
end
