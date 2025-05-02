require "test_helper"

module Grit::Assays
  class ExperimentDataSheetValuesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @experiment_data_sheet_value = grit_assays_experiment_data_sheet_values(:one)
    end

    test "should get index" do
      get experiment_data_sheet_values_url, as: :json
      assert_response :success
    end

    test "should create experiment_data_sheet_value" do
      assert_difference("ExperimentDataSheetValue.count") do
        post experiment_data_sheet_values_url, params: { experiment_data_sheet_value: {} }, as: :json
      end

      assert_response :created
    end

    test "should show experiment_data_sheet_value" do
      get experiment_data_sheet_value_url(@experiment_data_sheet_value), as: :json
      assert_response :success
    end

    test "should update experiment_data_sheet_value" do
      patch experiment_data_sheet_value_url(@experiment_data_sheet_value), params: { experiment_data_sheet_value: {} }, as: :json
      assert_response :success
    end

    test "should destroy experiment_data_sheet_value" do
      assert_difference("ExperimentDataSheetValue.count", -1) do
        delete experiment_data_sheet_value_url(@experiment_data_sheet_value), as: :json
      end

      assert_response :no_content
    end
  end
end
