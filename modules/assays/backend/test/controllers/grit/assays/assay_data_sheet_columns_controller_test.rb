require "test_helper"

module Grit::Assays
  class AssayDataSheetColumnsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @assay_data_sheet_column = grit_assays_assay_data_sheet_columns(:one)
    end

    test "should get index" do
      get assay_data_sheet_columns_url, as: :json
      assert_response :success
    end

    test "should create assay_data_sheet_column" do
      assert_difference("AssayDataSheetColumn.count") do
        post assay_data_sheet_columns_url, params: { assay_data_sheet_column: {} }, as: :json
      end

      assert_response :created
    end

    test "should show assay_data_sheet_column" do
      get assay_data_sheet_column_url(@assay_data_sheet_column), as: :json
      assert_response :success
    end

    test "should update assay_data_sheet_column" do
      patch assay_data_sheet_column_url(@assay_data_sheet_column), params: { assay_data_sheet_column: {} }, as: :json
      assert_response :success
    end

    test "should destroy assay_data_sheet_column" do
      assert_difference("AssayDataSheetColumn.count", -1) do
        delete assay_data_sheet_column_url(@assay_data_sheet_column), as: :json
      end

      assert_response :no_content
    end
  end
end
