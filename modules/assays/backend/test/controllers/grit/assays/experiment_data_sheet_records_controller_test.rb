# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class ExperimentDataSheetRecordsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      # Activate the authlogic mock controller BEFORE any AR saves that trigger
      # set_updater. Then login() (HTTP) at the end sets up the session cookie.
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))

      @draft_status     = grit_core_publication_statuses(:draft)
      @published_status = grit_core_publication_statuses(:published)

      @model = AssayModel.create!(
        name: "Controller Record Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: @draft_status
      )

      @sheet = AssayDataSheetDefinition.create!(
        name: "Controller Record Test Sheet",
        assay_model: @model,
        result: true,
        sort: 1
      )

      AssayDataSheetColumn.create!(
        name: "Value",
        safe_name: "value",
        assay_data_sheet_definition: @sheet,
        data_type: grit_core_data_types(:integer),
        sort: 1,
        required: false
      )

      @sheet.reload
      @sheet.create_table

      @experiment = Experiment.create!(
        name: "Controller Record Test Experiment",
        assay_model: @model,
        publication_status: @draft_status
      )

      @klass = ExperimentDataSheetRecord.sheet_record_klass(@sheet.id)
      @klass.reset_column_information

      # Login via HTTP last so the session cookie is set for subsequent requests.
      login(grit_core_users(:admin))
    end

    teardown do
      @sheet.drop_table rescue nil
      Experiment.delete(@experiment.id) rescue nil
      @model.destroy rescue nil
    end

    # Helper: create a record via HTTP and return its ID
    def http_create_record(value:, experiment: nil)
      exp = experiment || @experiment
      post grit_assays.assay_data_sheet_definition_experiment_data_sheet_records_url(@sheet),
        params: {
          experiment_id: exp.id,
          assay_data_sheet_definition_id: @sheet.id,
          value: value
        },
        as: :json
      assert_response :created
      JSON.parse(response.body)["data"]["id"]
    end

    # --- Create ---

    test "should create record" do
      assert_difference(-> { @klass.count }) do
        post grit_assays.assay_data_sheet_definition_experiment_data_sheet_records_url(@sheet),
          params: {
            experiment_id: @experiment.id,
            assay_data_sheet_definition_id: @sheet.id,
            value: 42
          },
          as: :json
      end
      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal 42, json["data"]["value"]
    end

    test "should not create record in a published experiment" do
      @experiment.update_column(:publication_status_id, @published_status.id)

      post grit_assays.assay_data_sheet_definition_experiment_data_sheet_records_url(@sheet),
        params: {
          experiment_id: @experiment.id,
          assay_data_sheet_definition_id: @sheet.id,
          value: 1
        },
        as: :json

      assert_response :internal_server_error
      json = JSON.parse(response.body)
      assert_not json["success"]
      assert_match(/published/i, json["errors"])
    end

    # --- Update ---

    test "should update record" do
      record_id = http_create_record(value: 1)

      patch grit_assays.assay_data_sheet_definition_experiment_data_sheet_record_url(@sheet, record_id),
        params: {
          id: record_id,
          experiment_id: @experiment.id,
          assay_data_sheet_definition_id: @sheet.id,
          value: 99
        },
        as: :json

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal 99, json["data"]["value"]
    end

    test "should not update record in a published experiment" do
      record_id = http_create_record(value: 1)
      @experiment.update_column(:publication_status_id, @published_status.id)

      patch grit_assays.assay_data_sheet_definition_experiment_data_sheet_record_url(@sheet, record_id),
        params: {
          id: record_id,
          experiment_id: @experiment.id,
          assay_data_sheet_definition_id: @sheet.id,
          value: 99
        },
        as: :json

      assert_response :internal_server_error
      json = JSON.parse(response.body)
      assert_not json["success"]
      assert_match(/published/i, json["errors"])
    end

    # --- Destroy ---

    test "should destroy a single record" do
      record_id = http_create_record(value: 5)

      assert_difference(-> { @klass.count }, -1) do
        delete grit_assays.assay_data_sheet_definition_experiment_data_sheet_record_url(@sheet, record_id),
          params: { assay_data_sheet_definition_id: @sheet.id },
          as: :json
      end
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
    end

    test "should destroy records in bulk" do
      record1_id = http_create_record(value: 10)
      record2_id = http_create_record(value: 20)

      assert_difference(-> { @klass.count }, -2) do
        delete grit_assays.assay_data_sheet_definition_experiment_data_sheet_record_url(@sheet, "destroy"),
          params: {
            assay_data_sheet_definition_id: @sheet.id,
            ids: "#{record1_id},#{record2_id}"
          },
          as: :json
      end
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
    end

    test "should not destroy record in a published experiment" do
      record_id = http_create_record(value: 5)
      @experiment.update_column(:publication_status_id, @published_status.id)

      delete grit_assays.assay_data_sheet_definition_experiment_data_sheet_record_url(@sheet, record_id),
        params: { assay_data_sheet_definition_id: @sheet.id },
        as: :json

      assert_response :internal_server_error
      json = JSON.parse(response.body)
      assert_not json["success"]
      assert_match(/published/i, json["errors"])
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      post grit_assays.assay_data_sheet_definition_experiment_data_sheet_records_url(@sheet),
        params: {
          experiment_id: @experiment.id,
          assay_data_sheet_definition_id: @sheet.id,
          value: 1
        },
        as: :json
      assert_response :unauthorized
    end
  end
end
