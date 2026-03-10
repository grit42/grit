# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableRowsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      # Pre-populate RequestStore so set_updater doesn't attempt an Authlogic
      # session lookup when creating records directly outside HTTP request context.
      RequestStore.store["current_user"] = grit_core_users(:admin)
      @vocab = Grit::Core::Vocabulary.create!(name: "Test Species")
      @data_type = @vocab.data_type
      @item1 = Grit::Core::VocabularyItem.create!(name: "Mouse", vocabulary: @vocab)
      # Creating the DataTable fires add_entity_type_display_columns, auto-creating
      # a DataTableColumn with safe_name: "entity_name".
      @data_table = DataTable.create!(name: "Test Table", entity_data_type: @data_type)
      DataTableEntity.create!(data_table_id: @data_table.id, entity_id: @item1.id)
    end

    # --- Full Perspective ---

    test "full_perspective returns row data for an entity" do
      get grit_assays.data_table_row_full_perspective_url(@item1.id),
        params: { data_table_id: @data_table.id, column_safe_name: "entity_name" }

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
    end

    test "full_perspective includes experiment results for assay data sheet column" do
      draft_status     = Grit::Core::PublicationStatus.find_by!(name: "Draft")
      published_status = Grit::Core::PublicationStatus.find_by!(name: "Published")
      integer_type     = Grit::Core::DataType.find_by!(name: "integer")
      assay_type       = grit_assays_assay_types(:biochemical)

      # 1. Draft assay model
      assay_model = AssayModel.new(name: "Test Species Assay", assay_type: assay_type)
      assay_model.publication_status = draft_status
      assay_model.save!

      # 2. Data sheet definition (result: true so it's eligible for data table columns)
      assay_def = AssayDataSheetDefinition.create!(
        name: "Test Results",
        result: true,
        sort: 1,
        assay_model: assay_model
      )

      # 3. Entity-link column: data_type must equal data_table.entity_data_type so that
      #    DataTableColumn#full_perspective_query can locate target_column.
      AssayDataSheetColumn.create!(
        name: "Species",
        safe_name: "sp_id",
        sort: 1,
        required: true,
        assay_data_sheet_definition: assay_def,
        data_type: @data_type
      )

      # 4. Measurement column
      measurement_col = AssayDataSheetColumn.create!(
        name: "IC50",
        safe_name: "ic_50_nm",
        sort: 2,
        required: false,
        assay_data_sheet_definition: assay_def,
        data_type: integer_type
      )

      # 5. Publish the assay model → creates ds_{assay_def.id} with sp_id + ic_50_nm columns
      assay_model.publication_status = published_status
      assay_model.save!
      assay_model.create_tables

      # 6. Wire the measurement column into the data table created in setup
      DataTableColumn.create!(
        name: "IC50 (nM)",
        safe_name: "ic_50_nm",
        source_type: "assay_data_sheet_column",
        aggregation_method: "latest",
        experiment_ids: [],
        metadata_filters: {},
        data_table: @data_table,
        assay_data_sheet_column: measurement_col
      )

      # 7. Draft experiment
      experiment = Experiment.new(name: "Test IC50 Experiment", assay_model: assay_model)
      experiment.publication_status = draft_status
      experiment.save!

      # 8. Add a second entity to the data table with its own result, to confirm
      #    the endpoint scopes correctly to the requested entity.
      item2 = Grit::Core::VocabularyItem.create!(name: "Rat", vocabulary: @vocab)
      DataTableEntity.create!(data_table_id: @data_table.id, entity_id: item2.id)

      record_klass = ExperimentDataSheetRecord.sheet_record_klass(assay_def.id)
      record_klass.create!(experiment_id: experiment.id, sp_id: @item1.id, ic_50_nm: 21)
      record_klass.create!(experiment_id: experiment.id, sp_id: @item1.id, ic_50_nm: 42)
      record_klass.create!(experiment_id: experiment.id, sp_id: item2.id, ic_50_nm: 99)

      # 9. Publish experiment so the full_perspective_query publication filters pass
      experiment.publication_status = published_status
      experiment.save!

      get grit_assays.data_table_row_full_perspective_url(@item1.id),
        params: { data_table_id: @data_table.id, column_safe_name: "ic_50_nm" }

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
      assert_equal 1, json["total"]
      row = json["data"].first
      assert_equal @item1.id, row["id"]
      assert_equal 42, row["ic_50_nm"]
      assert_equal experiment.id, row["experiment_id"]
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.data_table_row_full_perspective_url(0),
        params: { data_table_id: 0, column_safe_name: "entity_name" }
      assert_response :unauthorized
    end
  end
end
