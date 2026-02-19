# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class ExperimentDataSheetRecordTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))

      @draft_status = grit_core_publication_statuses(:draft)

      @model = AssayModel.create!(
        name: "Record Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: @draft_status
      )

      @sheet = AssayDataSheetDefinition.create!(
        name: "Record Test Sheet",
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
        name: "Record Test Experiment",
        assay_model: @model,
        publication_status: @draft_status
      )

      @klass = ExperimentDataSheetRecord.sheet_record_klass(@sheet.id)
      @klass.reset_column_information
    end

    teardown do
      @sheet.drop_table rescue nil
      Experiment.delete(@experiment.id) rescue nil
      @model.destroy rescue nil
    end

    # --- Permissions ---

    test "entity_crud returns correct roles" do
      crud = ExperimentDataSheetRecord.entity_crud
      assert_includes crud[:create], "Administrator"
      assert_includes crud[:create], "AssayAdministrator"
      assert_includes crud[:create], "AssayUser"
      assert_includes crud[:update], "Administrator"
      assert_includes crud[:update], "AssayAdministrator"
      assert_includes crud[:update], "AssayUser"
      assert_includes crud[:destroy], "Administrator"
      assert_includes crud[:destroy], "AssayAdministrator"
      assert_includes crud[:destroy], "AssayUser"
      assert_empty crud[:read]
    end

    # --- sheet_record_klass ---

    test "sheet_record_klass returns an ActiveRecord class" do
      klass = ExperimentDataSheetRecord.sheet_record_klass(@sheet.id)
      assert klass < ActiveRecord::Base
      assert_equal @sheet.table_name, klass.table_name
    end

    # --- create ---

    test "create builds a record in the dynamic table" do
      assert_difference(-> { @klass.count }) do
        ExperimentDataSheetRecord.create(
          "assay_data_sheet_definition_id" => @sheet.id,
          "experiment_id" => @experiment.id,
          "value" => 99
        )
      end
    end

    test "create sets experiment_id on the record" do
      record = ExperimentDataSheetRecord.create(
        "assay_data_sheet_definition_id" => @sheet.id,
        "experiment_id" => @experiment.id,
        "value" => 42
      )
      assert_equal @experiment.id, record.experiment_id
    end

    test "create sets created_by via callback" do
      record = ExperimentDataSheetRecord.create(
        "assay_data_sheet_definition_id" => @sheet.id,
        "experiment_id" => @experiment.id,
        "value" => 10
      )
      assert_equal "admin", record.created_by
    end

    # --- update ---

    test "update modifies a record" do
      record = @klass.create!(experiment_id: @experiment.id, value: 1)

      ExperimentDataSheetRecord.update(
        "assay_data_sheet_definition_id" => @sheet.id,
        "id" => record.id,
        "value" => 99
      )

      assert_equal 99, record.reload.value
    end

    test "update sets updated_by via callback" do
      record = @klass.create!(experiment_id: @experiment.id, value: 1)

      ExperimentDataSheetRecord.update(
        "assay_data_sheet_definition_id" => @sheet.id,
        "id" => record.id,
        "value" => 50
      )

      assert_equal "admin", record.reload.updated_by
    end

    # --- by_experiment ---

    test "by_experiment returns only records for the given experiment" do
      experiment2 = Experiment.create!(
        name: "Second Experiment",
        assay_model: @model,
        publication_status: @draft_status
      )

      @klass.create!(experiment_id: @experiment.id, value: 1)
      @klass.create!(experiment_id: @experiment.id, value: 2)
      @klass.create!(experiment_id: experiment2.id, value: 3)

      result = ExperimentDataSheetRecord.by_experiment(
        { "experiment_id" => @experiment.id,
          "assay_data_sheet_definition_id" => @sheet.id }.with_indifferent_access
      )

      assert_equal 2, result.count(:all)

      @klass.where(experiment_id: experiment2.id).delete_all
      Experiment.delete(experiment2.id)
    end

    test "by_experiment raises without experiment_id" do
      assert_raises(RuntimeError) do
        ExperimentDataSheetRecord.by_experiment(
          "assay_data_sheet_definition_id" => @sheet.id
        )
      end
    end

    test "by_experiment raises without assay_data_sheet_definition_id" do
      assert_raises(RuntimeError) do
        ExperimentDataSheetRecord.by_experiment(
          "experiment_id" => @experiment.id
        )
      end
    end

    # --- detailed ---

    test "detailed raises without assay_data_sheet_definition_id" do
      assert_raises(RuntimeError) do
        ExperimentDataSheetRecord.detailed({})
      end
    end

    test "detailed returns a scoped query including custom columns" do
      @klass.create!(experiment_id: @experiment.id, value: 77)

      result = ExperimentDataSheetRecord.detailed(
        "assay_data_sheet_definition_id" => @sheet.id
      )

      assert_not_nil result
      record = result.first
      assert_respond_to record, :value
      assert_equal 77, record.value
    end

    # --- entity_fields / entity_columns ---

    test "entity_fields returns fields for the sheet" do
      fields = ExperimentDataSheetRecord.entity_fields(
        assay_data_sheet_definition_id: @sheet.id
      )
      field_names = fields.map { |f| f[:name] }
      assert_includes field_names, "value"
    end

    test "entity_columns returns columns for the sheet" do
      columns = ExperimentDataSheetRecord.entity_columns(
        assay_data_sheet_definition_id: @sheet.id
      )
      column_names = columns.map { |c| c[:name] }
      assert_includes column_names, "value"
    end
  end
end
