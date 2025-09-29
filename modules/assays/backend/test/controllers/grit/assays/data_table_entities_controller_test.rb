require "test_helper"

module Grit::Assays
  class DataTableEntitiesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @data_table_entity = grit_assays_data_table_entities(:one)
    end

    test "should get index" do
      get data_table_entities_url, as: :json
      assert_response :success
    end

    test "should create data_table_entity" do
      assert_difference("DataTableEntity.count") do
        post data_table_entities_url, params: { data_table_entity: {} }, as: :json
      end

      assert_response :created
    end

    test "should show data_table_entity" do
      get data_table_entity_url(@data_table_entity), as: :json
      assert_response :success
    end

    test "should update data_table_entity" do
      patch data_table_entity_url(@data_table_entity), params: { data_table_entity: {} }, as: :json
      assert_response :success
    end

    test "should destroy data_table_entity" do
      assert_difference("DataTableEntity.count", -1) do
        delete data_table_entity_url(@data_table_entity), as: :json
      end

      assert_response :no_content
    end
  end
end
