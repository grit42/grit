require "test_helper"

module Grit::Assays
  class DataTableColumnsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @data_table_column = grit_assays_data_table_columns(:one)
    end

    test "should get index" do
      get data_table_columns_url, as: :json
      assert_response :success
    end

    test "should create data_table_column" do
      assert_difference("DataTableColumn.count") do
        post data_table_columns_url, params: { data_table_column: {} }, as: :json
      end

      assert_response :created
    end

    test "should show data_table_column" do
      get data_table_column_url(@data_table_column), as: :json
      assert_response :success
    end

    test "should update data_table_column" do
      patch data_table_column_url(@data_table_column), params: { data_table_column: {} }, as: :json
      assert_response :success
    end

    test "should destroy data_table_column" do
      assert_difference("DataTableColumn.count", -1) do
        delete data_table_column_url(@data_table_column), as: :json
      end

      assert_response :no_content
    end
  end
end
