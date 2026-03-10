# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayDataSheetColumnsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @draft_column = grit_assays_assay_data_sheet_columns(:draft_results_concentration)
      @published_column = grit_assays_assay_data_sheet_columns(:published_viability)
      @draft_sheet = grit_assays_assay_data_sheet_definitions(:draft_model_results)
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.assay_data_sheet_columns_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Show ---

    test "should show assay_data_sheet_column" do
      get grit_assays.assay_data_sheet_column_url(@draft_column), as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal @draft_column.id, json["data"]["id"]
    end

    # --- Create ---

    test "should create assay_data_sheet_column on draft model" do
      assert_difference("AssayDataSheetColumn.count") do
        post grit_assays.assay_data_sheet_columns_url, params: {
          name: "New Column",
          safe_name: "new_column",
          description: "A new column",
          assay_data_sheet_definition_id: @draft_sheet.id,
          data_type_id: grit_core_data_types(:integer).id,
          sort: 10,
          required: false
        }, as: :json
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "New Column", json["data"]["name"]
    end

    test "should not create assay_data_sheet_column on published model" do
      published_sheet = grit_assays_assay_data_sheet_definitions(:published_model_results)

      assert_no_difference("AssayDataSheetColumn.count") do
        post grit_assays.assay_data_sheet_columns_url, params: {
          name: "New Column",
          safe_name: "new_column_pub",
          assay_data_sheet_definition_id: published_sheet.id,
          data_type_id: grit_core_data_types(:integer).id,
          sort: 10,
          required: false
        }, as: :json
      end

      assert_response :internal_server_error
    end

    test "should not create assay_data_sheet_column with invalid safe_name" do
      assert_no_difference("AssayDataSheetColumn.count") do
        post grit_assays.assay_data_sheet_columns_url, params: {
          name: "Bad Column",
          safe_name: "1_invalid",
          assay_data_sheet_definition_id: @draft_sheet.id,
          data_type_id: grit_core_data_types(:integer).id,
          sort: 10,
          required: false
        }, as: :json
      end

      assert_response :unprocessable_entity
    end

    # --- Update ---

    test "should update assay_data_sheet_column on draft model" do
      patch grit_assays.assay_data_sheet_column_url(@draft_column), params: {
        description: "Updated description"
      }, as: :json

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "Updated description", @draft_column.reload.description
    end

    test "should not update assay_data_sheet_column on published model" do
      patch grit_assays.assay_data_sheet_column_url(@published_column), params: {
        description: "Cannot update"
      }, as: :json

      assert_response :internal_server_error
    end

    # --- Destroy ---

    test "should destroy assay_data_sheet_column on draft model" do
      # First create via API to avoid authlogic issues
      post grit_assays.assay_data_sheet_columns_url, params: {
        name: "To Delete",
        safe_name: "to_delete_col",
        assay_data_sheet_definition_id: @draft_sheet.id,
        data_type_id: grit_core_data_types(:integer).id,
        sort: 99,
        required: false
      }, as: :json
      assert_response :created
      column_id = JSON.parse(response.body)["data"]["id"]

      assert_difference("AssayDataSheetColumn.count", -1) do
        delete grit_assays.assay_data_sheet_column_url(column_id), as: :json
      end

      assert_response :success
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.assay_data_sheet_columns_url, as: :json
      assert_response :unauthorized
    end
  end
end
