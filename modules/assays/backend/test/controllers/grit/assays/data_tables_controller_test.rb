# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTablesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.data_tables_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.data_tables_url, as: :json
      assert_response :unauthorized
    end

    # Note: Full DataTable CRUD testing requires entity data types that
    # point to real entity models. Creating and manipulating data tables
    # needs proper seeds loaded with entity data types like Compound or Batch.
    # These tests verify basic endpoint availability and authentication.
  end
end
