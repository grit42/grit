# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class ExperimentMetadataControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @draft_experiment_species = grit_assays_experiment_metadata(:draft_experiment_species)
      @draft_experiment = grit_assays_experiments(:draft_experiment)
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.experiment_metadata_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Show ---

    test "should show experiment_metadatum" do
      get grit_assays.experiment_metadatum_url(@draft_experiment_species), as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal @draft_experiment_species.id, json["data"]["id"]
    end

    # Note: Experiment metadata is created/updated/destroyed via fixture data
    # Full CRUD testing requires creating experiments first which triggers
    # metadata validation. These tests verify basic controller structure.

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.experiment_metadata_url, as: :json
      assert_response :unauthorized
    end
  end
end
