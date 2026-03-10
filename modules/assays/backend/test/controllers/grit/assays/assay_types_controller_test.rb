# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayTypesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @assay_type = grit_assays_assay_types(:biochemical)
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.assay_types_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Show ---

    test "should show assay_type" do
      get grit_assays.assay_type_url(@assay_type), as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal @assay_type.id, json["data"]["id"]
    end

    # --- Create ---

    test "should create assay_type" do
      assert_difference("AssayType.count") do
        post grit_assays.assay_types_url, params: {
          name: "New Assay Type",
          description: "A new assay type"
        }, as: :json
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "New Assay Type", json["data"]["name"]
    end

    test "should not create assay_type without name" do
      assert_no_difference("AssayType.count") do
        post grit_assays.assay_types_url, params: {
          description: "Missing name"
        }, as: :json
      end

      assert_response :unprocessable_entity
      json = JSON.parse(response.body)
      assert_not json["success"]
    end

    # --- Update ---

    test "should update assay_type" do
      patch grit_assays.assay_type_url(@assay_type), params: { name: "Updated Name" }, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "Updated Name", @assay_type.reload.name
    end

    # --- Destroy ---

    test "should destroy assay_type" do
      # First create via API to avoid authlogic issues
      post grit_assays.assay_types_url, params: {
        name: "To Delete",
        description: "Will be deleted"
      }, as: :json
      assert_response :created
      assay_type_id = JSON.parse(response.body)["data"]["id"]

      assert_difference("AssayType.count", -1) do
        delete grit_assays.assay_type_url(assay_type_id), as: :json
      end
      assert_response :success
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.assay_types_url, as: :json
      assert_response :unauthorized
    end
  end
end
