# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayDataSheetDefinitionsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @draft_sheet = grit_assays_assay_data_sheet_definitions(:draft_model_results)
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.assay_data_sheet_definitions_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Show ---

    test "should show assay_data_sheet_definition" do
      get grit_assays.assay_data_sheet_definition_url(@draft_sheet), as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal @draft_sheet.id, json["data"]["id"]
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.assay_data_sheet_definitions_url, as: :json
      assert_response :unauthorized
    end

    # Note: Full CRUD testing for AssayDataSheetDefinitions is complex due to
    # publication status constraints. Sheet definitions are typically created
    # as part of assay model creation via the assay_models_controller.
  end
end
