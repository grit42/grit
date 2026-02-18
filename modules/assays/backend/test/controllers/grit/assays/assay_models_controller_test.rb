# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayModelsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @draft_model = grit_assays_assay_models(:draft_model)
      @published_model = grit_assays_assay_models(:published_model)
    end

    # --- Index ---

    test "should get index" do
      get grit_assays.assay_models_url, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_kind_of Array, json["data"]
    end

    # --- Show ---

    test "should show assay_model" do
      get grit_assays.assay_model_url(@draft_model), as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal @draft_model.id, json["data"]["id"]
    end

    # --- Create ---

    test "should create assay_model with minimal params" do
      assert_difference("AssayModel.count") do
        post grit_assays.assay_models_url, params: {
          name: "New Test Assay",
          assay_type_id: grit_assays_assay_types(:biochemical).id
        }, as: :json
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "New Test Assay", json["data"]["name"]
    end

    test "should create assay_model with sheets and columns" do
      assert_difference("AssayModel.count") do
        assert_difference("AssayDataSheetDefinition.count") do
          assert_difference("AssayDataSheetColumn.count") do
            post grit_assays.assay_models_url, params: {
              name: "Assay With Sheets",
              assay_type_id: grit_assays_assay_types(:biochemical).id,
              sheets: [
                {
                  name: "Results Sheet",
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
          end
        end
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]
    end

    test "should not create assay_model without name" do
      assert_no_difference("AssayModel.count") do
        post grit_assays.assay_models_url, params: {
          assay_type_id: grit_assays_assay_types(:biochemical).id
        }, as: :json
      end

      assert_response :unprocessable_entity
      json = JSON.parse(response.body)
      assert_not json["success"]
    end

    test "newly created assay_model has draft publication status" do
      post grit_assays.assay_models_url, params: {
        name: "Draft Status Check",
        assay_type_id: grit_assays_assay_types(:biochemical).id
      }, as: :json

      assert_response :created
      json = JSON.parse(response.body)
      created = AssayModel.find(json["data"]["id"])
      assert_equal "Draft", created.publication_status.name
    end

    # --- Update ---

    test "should update draft assay_model" do
      patch grit_assays.assay_model_url(@draft_model), params: { name: "Updated Draft Name" }, as: :json
      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "Updated Draft Name", @draft_model.reload.name
    end

    test "should not update published assay_model" do
      patch grit_assays.assay_model_url(@published_model), params: { name: "Cannot Update" }, as: :json
      assert_response :internal_server_error
      json = JSON.parse(response.body)
      assert_not json["success"]
    end

    # --- Destroy ---

    test "should destroy draft assay_model" do
      post grit_assays.assay_models_url, params: {
        name: "To Be Destroyed",
        assay_type_id: grit_assays_assay_types(:biochemical).id
      }, as: :json
      assert_response :created
      model_id = JSON.parse(response.body)["data"]["id"]

      assert_difference("AssayModel.count", -1) do
        delete grit_assays.assay_model_url(model_id), as: :json
      end
      assert_response :success
    end

    # --- Publish ---

    test "should publish a draft assay_model" do
      post grit_assays.assay_models_url, params: {
        name: "To Be Published",
        assay_type_id: grit_assays_assay_types(:biochemical).id,
        sheets: [ { name: "Results", result: true, sort: 1, columns: [] } ]
      }, as: :json
      assert_response :created
      model_id = JSON.parse(response.body)["data"]["id"]
      sheet = AssayDataSheetDefinition.find_by(assay_model_id: model_id)

      post grit_assays.assay_model_publish_url(model_id), as: :json

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "Published", AssayModel.find(model_id).publication_status.name
      assert ActiveRecord::Base.connection.table_exists?(sheet.table_name)

      # Clean up dynamic tables via draft action
      post grit_assays.assay_model_draft_url(model_id), as: :json
    end

    test "publish creates dynamic tables for each sheet" do
      post grit_assays.assay_models_url, params: {
        name: "Publish Table Creation Test",
        assay_type_id: grit_assays_assay_types(:biochemical).id,
        sheets: [
          { name: "Sheet 1", result: true, sort: 1, columns: [] },
          { name: "Sheet 2", result: false, sort: 2, columns: [] }
        ]
      }, as: :json
      assert_response :created
      model_id = JSON.parse(response.body)["data"]["id"]
      sheets = AssayDataSheetDefinition.where(assay_model_id: model_id).order(:sort)

      post grit_assays.assay_model_publish_url(model_id), as: :json

      assert_response :success
      assert ActiveRecord::Base.connection.table_exists?(sheets.first.table_name)
      assert ActiveRecord::Base.connection.table_exists?(sheets.second.table_name)

      # Clean up
      post grit_assays.assay_model_draft_url(model_id), as: :json
    end

    # --- Draft (unpublish) ---

    test "should move published assay_model back to draft" do
      post grit_assays.assay_models_url, params: {
        name: "To Be Drafted",
        assay_type_id: grit_assays_assay_types(:biochemical).id,
        sheets: [ { name: "Sheet", result: true, sort: 1, columns: [] } ]
      }, as: :json
      assert_response :created
      model_id = JSON.parse(response.body)["data"]["id"]
      sheet = AssayDataSheetDefinition.find_by(assay_model_id: model_id)

      post grit_assays.assay_model_publish_url(model_id), as: :json
      assert ActiveRecord::Base.connection.table_exists?(sheet.table_name)

      post grit_assays.assay_model_draft_url(model_id), as: :json

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal "Draft", AssayModel.find(model_id).publication_status.name
      assert_not ActiveRecord::Base.connection.table_exists?(sheet.table_name)
    end

    test "draft action destroys all experiments" do
      post grit_assays.assay_models_url, params: {
        name: "Draft Destroys Experiments",
        assay_type_id: grit_assays_assay_types(:biochemical).id
      }, as: :json
      assert_response :created
      model_id = JSON.parse(response.body)["data"]["id"]

      post grit_assays.assay_model_publish_url(model_id), as: :json
      assert_response :success

      post grit_assays.experiments_url, params: {
        name: "Experiment To Destroy",
        assay_model_id: model_id
      }, as: :json
      assert_response :created
      experiment_id = JSON.parse(response.body)["data"]["id"]

      post grit_assays.assay_model_draft_url(model_id), as: :json

      assert_response :success
      assert_not Experiment.exists?(experiment_id)
    end

    # --- update_metadata ---

    test "should update metadata for an assay_model" do
      post grit_assays.assay_models_url, params: {
        name: "Metadata Test Model",
        assay_type_id: grit_assays_assay_types(:biochemical).id
      }, as: :json
      assert_response :created
      model_id = JSON.parse(response.body)["data"]["id"]

      species_id = grit_assays_assay_metadata_definitions(:species).id
      tissue_id = grit_assays_assay_metadata_definitions(:tissue_type).id

      assert_difference("AssayModelMetadatum.count") do
        post grit_assays.assay_model_update_metadata_url(model_id), params: {
          assay_model_id: model_id,
          removed: [],
          added: [ species_id ]
        }, as: :json
      end
      assert_response :success
      assert JSON.parse(response.body)["success"]
      assert AssayModelMetadatum.exists?(assay_model_id: model_id, assay_metadata_definition_id: species_id)

      # Swap species for tissue_type
      assert_difference("AssayModelMetadatum.count", 0) do
        post grit_assays.assay_model_update_metadata_url(model_id), params: {
          assay_model_id: model_id,
          removed: [ species_id ],
          added: [ tissue_id ]
        }, as: :json
      end

      assert_response :success
      assert AssayModelMetadatum.exists?(assay_model_id: model_id, assay_metadata_definition_id: tissue_id)
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.assay_models_url, as: :json
      assert_response :unauthorized
    end
  end
end
