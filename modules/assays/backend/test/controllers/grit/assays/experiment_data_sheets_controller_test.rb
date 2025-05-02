require "test_helper"

module Grit::Assays
  class ExperimentDataSheetsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @experiment_data_sheet = grit_assays_experiment_data_sheets(:one)
    end

    test "should get index" do
      get experiment_data_sheets_url, as: :json
      assert_response :success
    end

    test "should create experiment_data_sheet" do
      assert_difference("ExperimentDataSheet.count") do
        post experiment_data_sheets_url, params: { experiment_data_sheet: {} }, as: :json
      end

      assert_response :created
    end

    test "should show experiment_data_sheet" do
      get experiment_data_sheet_url(@experiment_data_sheet), as: :json
      assert_response :success
    end

    test "should update experiment_data_sheet" do
      patch experiment_data_sheet_url(@experiment_data_sheet), params: { experiment_data_sheet: {} }, as: :json
      assert_response :success
    end

    test "should destroy experiment_data_sheet" do
      assert_difference("ExperimentDataSheet.count", -1) do
        delete experiment_data_sheet_url(@experiment_data_sheet), as: :json
      end

      assert_response :no_content
    end
  end
end
