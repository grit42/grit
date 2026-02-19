# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableEntitiesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
    end

    # --- Basic Controller Structure ---

    test "DataTableEntitiesController is defined" do
      assert defined?(DataTableEntitiesController)
    end

    # Note: DataTableEntities requires data_table_id parameter for index
    # Full CRUD testing requires entity data types

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.data_table_entities_url, as: :json
      assert_response :unauthorized
    end

    # Note: Full DataTableEntity CRUD testing requires data tables with
    # entity data types. These tests verify basic endpoint availability.
  end
end
