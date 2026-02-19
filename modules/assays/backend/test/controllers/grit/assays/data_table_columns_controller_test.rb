# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableColumnsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.data_table_columns_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.data_table_columns_url, as: :json
      assert_response :unauthorized
    end

    # Note: Full DataTableColumn CRUD testing requires data tables with
    # entity data types. These tests verify basic endpoint availability.
  end
end
