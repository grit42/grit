# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayMetadataDefinitionsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @species = grit_assays_assay_metadata_definitions(:species)
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.assay_metadata_definitions_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Show ---

    test "should show assay_metadata_definition" do
      get grit_assays.assay_metadata_definition_url(@species), as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal @species.id, json["data"]["id"]
    end

    # --- Create ---

    test "should create assay_metadata_definition" do
      assert_difference("AssayMetadataDefinition.count") do
        post grit_assays.assay_metadata_definitions_url, params: {
          name: "New Metadata",
          safe_name: "new_metadata",
          description: "A new metadata definition",
          vocabulary_id: grit_core_vocabularies(:one).id
        }, as: :json
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "New Metadata", json["data"]["name"]
    end

    test "should not create assay_metadata_definition without name" do
      assert_no_difference("AssayMetadataDefinition.count") do
        post grit_assays.assay_metadata_definitions_url, params: {
          safe_name: "missing_name",
          vocabulary_id: grit_core_vocabularies(:one).id
        }, as: :json
      end

      assert_response :unprocessable_entity
    end

    test "should not create assay_metadata_definition with invalid safe_name" do
      assert_no_difference("AssayMetadataDefinition.count") do
        post grit_assays.assay_metadata_definitions_url, params: {
          name: "Invalid Safe Name",
          safe_name: "1_invalid",
          vocabulary_id: grit_core_vocabularies(:one).id
        }, as: :json
      end

      assert_response :unprocessable_entity
    end

    # --- Update ---

    test "should not update assay_metadata_definition in use" do
      # species is linked via assay_model_metadata fixture
      patch grit_assays.assay_metadata_definition_url(@species), params: {
        name: "Updated Species"
      }, as: :json

      assert_response :internal_server_error
    end

    # --- Destroy ---

    test "should not destroy assay_metadata_definition required in assay model" do
      # species is linked via assay_model_metadata fixture
      assert_no_difference("AssayMetadataDefinition.count") do
        delete grit_assays.assay_metadata_definition_url(@species), as: :json
      end

      assert_response :internal_server_error
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.assay_metadata_definitions_url, as: :json
      assert_response :unauthorized
    end
  end
end
