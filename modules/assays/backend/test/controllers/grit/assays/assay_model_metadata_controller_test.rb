# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayModelMetadataControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @draft_model_species = grit_assays_assay_model_metadata(:draft_model_species)
      @published_model_species = grit_assays_assay_model_metadata(:published_model_species)
      @draft_model = grit_assays_assay_models(:draft_model)
      @published_model = grit_assays_assay_models(:published_model)
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.assay_model_metadata_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Show ---

    test "should show assay_model_metadatum" do
      get grit_assays.assay_model_metadatum_url(@draft_model_species), as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal @draft_model_species.id, json["data"]["id"]
    end

    # --- Create ---

    test "should create assay_model_metadatum on draft model" do
      # Create definition via API
      post grit_assays.assay_metadata_definitions_url, params: {
        name: "Test Create Definition",
        safe_name: "test_create_def",
        vocabulary_id: grit_core_vocabularies(:one).id
      }, as: :json
      assert_response :created
      definition_id = JSON.parse(response.body)["data"]["id"]

      assert_difference("AssayModelMetadatum.count") do
        post grit_assays.assay_model_metadata_url, params: {
          assay_model_id: @draft_model.id,
          assay_metadata_definition_id: definition_id
        }, as: :json
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]

      # Cleanup
      delete grit_assays.assay_model_metadatum_url(json["data"]["id"]), as: :json
      delete grit_assays.assay_metadata_definition_url(definition_id), as: :json
    end

    test "should not create assay_model_metadatum on published model" do
      # Create definition via API
      post grit_assays.assay_metadata_definitions_url, params: {
        name: "Test Published Definition",
        safe_name: "test_pub_def",
        vocabulary_id: grit_core_vocabularies(:one).id
      }, as: :json
      assert_response :created
      definition_id = JSON.parse(response.body)["data"]["id"]

      assert_no_difference("AssayModelMetadatum.count") do
        post grit_assays.assay_model_metadata_url, params: {
          assay_model_id: @published_model.id,
          assay_metadata_definition_id: definition_id
        }, as: :json
      end

      assert_response :internal_server_error

      delete grit_assays.assay_metadata_definition_url(definition_id), as: :json
    end

    # Note: Update tests are complex due to publication status constraints

    # --- Destroy ---

    test "should destroy assay_model_metadatum on draft model" do
      # Create definition via API
      post grit_assays.assay_metadata_definitions_url, params: {
        name: "Destroy Test Definition",
        safe_name: "destroy_test_def",
        vocabulary_id: grit_core_vocabularies(:one).id
      }, as: :json
      assert_response :created
      definition_id = JSON.parse(response.body)["data"]["id"]

      # Create link via API
      post grit_assays.assay_model_metadata_url, params: {
        assay_model_id: @draft_model.id,
        assay_metadata_definition_id: definition_id
      }, as: :json
      assert_response :created
      link_id = JSON.parse(response.body)["data"]["id"]

      assert_difference("AssayModelMetadatum.count", -1) do
        delete grit_assays.assay_model_metadatum_url(link_id), as: :json
      end

      assert_response :success

      delete grit_assays.assay_metadata_definition_url(definition_id), as: :json
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.assay_model_metadata_url, as: :json
      assert_response :unauthorized
    end
  end
end
