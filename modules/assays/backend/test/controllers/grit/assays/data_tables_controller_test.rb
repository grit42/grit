require "test_helper"

module Grit::Assays
  class DataTablesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @data_table = grit_assays_data_tables(:one)
    end

    test "should get index" do
      get data_tables_url, as: :json
      assert_response :success
    end

    test "should create data_table" do
      assert_difference("DataTable.count") do
        post data_tables_url, params: { data_table: {} }, as: :json
      end

      assert_response :created
    end

    test "should show data_table" do
      get data_table_url(@data_table), as: :json
      assert_response :success
    end

    test "should update data_table" do
      patch data_table_url(@data_table), params: { data_table: {} }, as: :json
      assert_response :success
    end

    test "should destroy data_table" do
      assert_difference("DataTable.count", -1) do
        delete data_table_url(@data_table), as: :json
      end

      assert_response :no_content
    end
  end
end
