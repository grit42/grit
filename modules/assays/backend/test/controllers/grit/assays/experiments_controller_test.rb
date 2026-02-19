# frozen_string_literal: true

require "test_helper"
require "zip"

module Grit::Assays
  class ExperimentsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @draft_experiment = grit_assays_experiments(:draft_experiment)
      @published_experiment = grit_assays_experiments(:published_experiment)
      @draft_model = grit_assays_assay_models(:draft_model)
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.experiments_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Show ---

    test "should show experiment" do
      get grit_assays.experiment_url(@draft_experiment), as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal @draft_experiment.id, json["data"]["id"]
    end

    test "show includes data_sheets" do
      get grit_assays.experiment_url(@draft_experiment), as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["data"].key?("data_sheets")
      assert_kind_of Array, json["data"]["data_sheets"]
    end

    # --- Create ---

    test "should create experiment" do
      assert_difference("Experiment.count") do
        post grit_assays.experiments_url, params: {
          name: "New Test Experiment",
          assay_model_id: @draft_model.id
        }, as: :json
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "New Test Experiment", json["data"]["name"]
    end

    test "newly created experiment has draft publication status" do
      post grit_assays.experiments_url, params: {
        name: "Draft Status Check Experiment",
        assay_model_id: @draft_model.id
      }, as: :json

      assert_response :created
      json = JSON.parse(response.body)
      created = Experiment.find(json["data"]["id"])
      assert_equal "Draft", created.publication_status.name
    end

    test "should create experiment with metadata" do
      vocab_item = grit_core_vocabulary_items(:oneone)
      species_def = grit_assays_assay_metadata_definitions(:species)

      assert_difference("Experiment.count") do
        assert_difference("ExperimentMetadatum.count") do
          post grit_assays.experiments_url, params: {
            name: "Experiment With Metadata",
            assay_model_id: @draft_model.id,
            species: vocab_item.id
          }, as: :json
        end
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]

      created = Experiment.find(json["data"]["id"])
      metadata = created.experiment_metadata.find_by(assay_metadata_definition: species_def)
      assert_not_nil metadata
      assert_equal vocab_item.id, metadata.vocabulary_item_id
    end

    test "should not create experiment without name" do
      assert_no_difference("Experiment.count") do
        post grit_assays.experiments_url, params: {
          assay_model_id: @draft_model.id
        }, as: :json
      end

      assert_response :unprocessable_entity
      json = JSON.parse(response.body)
      assert_not json["success"]
    end

    # --- Update ---

    test "should update draft experiment" do
      patch grit_assays.experiment_url(@draft_experiment), params: { name: "Updated Experiment Name" }, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "Updated Experiment Name", @draft_experiment.reload.name
    end

    test "should update experiment metadata on update" do
      species_def = grit_assays_assay_metadata_definitions(:species)
      new_vocab_item = grit_core_vocabulary_items(:onetwo)

      patch grit_assays.experiment_url(@draft_experiment), params: {
        name: @draft_experiment.name,
        species: new_vocab_item.id
      }, as: :json

      assert_response :success
      @draft_experiment.reload
      metadata = @draft_experiment.experiment_metadata.find_by(assay_metadata_definition: species_def)
      assert_not_nil metadata
      assert_equal new_vocab_item.id, metadata.vocabulary_item_id
    end

    # --- Destroy ---

    test "should destroy draft experiment" do
      post grit_assays.experiments_url, params: {
        name: "To Be Destroyed",
        assay_model_id: @draft_model.id
      }, as: :json
      assert_response :created
      experiment_id = JSON.parse(response.body)["data"]["id"]

      assert_difference("Experiment.count", -1) do
        delete grit_assays.experiment_url(experiment_id), as: :json
      end
      assert_response :success
    end

    # --- Publish ---

    test "should publish a draft experiment" do
      post grit_assays.experiments_url, params: {
        name: "To Be Published",
        assay_model_id: @draft_model.id
      }, as: :json
      assert_response :created
      experiment_id = JSON.parse(response.body)["data"]["id"]

      post grit_assays.experiment_publish_url(experiment_id), as: :json

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "Published", Experiment.find(experiment_id).publication_status.name
    end

    # --- Draft (unpublish) ---

    test "should move published experiment back to draft" do
      post grit_assays.experiments_url, params: {
        name: "To Be Drafted",
        assay_model_id: @draft_model.id
      }, as: :json
      assert_response :created
      experiment_id = JSON.parse(response.body)["data"]["id"]

      post grit_assays.experiment_publish_url(experiment_id), as: :json
      assert_response :success

      post grit_assays.experiment_draft_url(experiment_id), as: :json

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "Draft", Experiment.find(experiment_id).publication_status.name
    end

    # --- Export ZIP ---

    test "export returns a ZIP file containing a CSV for each data sheet" do
      # Publish a model to create dynamic tables, then export an experiment against it
      post grit_assays.assay_models_url, params: {
        name: "Export Test Model",
        assay_type_id: grit_assays_assay_types(:biochemical).id,
        sheets: [
          {
            name: "Results",
            result: true,
            sort: 1,
            columns: [
              {
                name: "IC50",
                safe_name: "ic50",
                sort: 1,
                required: false,
                data_type_id: grit_core_data_types(:integer).id
              }
            ]
          }
        ]
      }, as: :json
      assert_response :created
      model_id = JSON.parse(response.body)["data"]["id"]

      post grit_assays.assay_model_publish_url(model_id), as: :json
      assert_response :success

      post grit_assays.experiments_url, params: {
        name: "Export Test Experiment",
        assay_model_id: model_id
      }, as: :json
      assert_response :created
      experiment_id = JSON.parse(response.body)["data"]["id"]

      get grit_assays.experiment_export_url(experiment_id)

      assert_response :success
      assert_equal "application/zip", response.content_type
      assert_includes response.headers["Content-Disposition"], "Export Test Experiment.zip"

      zip_entries = []
      Zip::InputStream.open(StringIO.new(response.body)) do |zip|
        while (entry = zip.get_next_entry)
          zip_entries << entry.name
        end
      end

      assert_includes zip_entries, "Export Test Experiment/data/Results.csv"

      # Clean up dynamic tables and experiments
      post grit_assays.assay_model_draft_url(model_id), as: :json
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.experiments_url, as: :json
      assert_response :unauthorized
    end
  end
end
