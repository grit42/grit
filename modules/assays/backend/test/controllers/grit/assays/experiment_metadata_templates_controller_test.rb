# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class ExperimentMetadataTemplatesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.experiment_metadata_templates_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Create ---

    test "should create experiment_metadata_template" do
      species_def = grit_assays_assay_metadata_definitions(:species)
      vocab_item = grit_core_vocabulary_items(:oneone)

      assert_difference("ExperimentMetadataTemplate.count") do
        post grit_assays.experiment_metadata_templates_url, params: {
          name: "New Template",
          description: "A new template",
          species_def.safe_name => vocab_item.id
        }, as: :json
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "New Template", json["data"]["name"]

      # Cleanup
      ExperimentMetadataTemplate.find(json["data"]["id"]).destroy
    end

    test "should not create experiment_metadata_template without name" do
      assert_no_difference("ExperimentMetadataTemplate.count") do
        post grit_assays.experiment_metadata_templates_url, params: {
          description: "Missing name"
        }, as: :json
      end

      assert_response :unprocessable_entity
    end

    # Note: Full CRUD tests require API-based record creation
    # These structural tests verify the controller is accessible

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.experiment_metadata_templates_url, as: :json
      assert_response :unauthorized
    end
  end
end
