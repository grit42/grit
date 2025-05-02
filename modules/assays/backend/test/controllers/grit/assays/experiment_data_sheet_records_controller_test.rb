require "test_helper"

module Grit::Assays
  class ExperimentDataSheetRecordsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @experiment_data_sheet_record = grit_assays_experiment_data_sheet_records(:one)
    end

    test "should get index" do
      get experiment_data_sheet_records_url, as: :json
      assert_response :success
    end

    test "should create experiment_data_sheet_record" do
      assert_difference("ExperimentDataSheetRecord.count") do
        post experiment_data_sheet_records_url, params: { experiment_data_sheet_record: {} }, as: :json
      end

      assert_response :created
    end

    test "should show experiment_data_sheet_record" do
      get experiment_data_sheet_record_url(@experiment_data_sheet_record), as: :json
      assert_response :success
    end

    test "should update experiment_data_sheet_record" do
      patch experiment_data_sheet_record_url(@experiment_data_sheet_record), params: { experiment_data_sheet_record: {} }, as: :json
      assert_response :success
    end

    test "should destroy experiment_data_sheet_record" do
      assert_difference("ExperimentDataSheetRecord.count", -1) do
        delete experiment_data_sheet_record_url(@experiment_data_sheet_record), as: :json
      end

      assert_response :no_content
    end
  end
end
