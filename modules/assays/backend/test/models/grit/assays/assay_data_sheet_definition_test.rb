# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayDataSheetDefinitionTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @draft_sheet = grit_assays_assay_data_sheet_definitions(:draft_model_results)
      @published_sheet = grit_assays_assay_data_sheet_definitions(:published_model_results)
    end

    # --- Fixtures ---

    test "fixtures load correctly" do
      assert_not_nil @draft_sheet
      assert_not_nil @published_sheet
      assert_equal "Results", @draft_sheet.name
      assert_equal "Viability Results", @published_sheet.name
    end

    # --- Associations ---

    test "belongs to assay_model" do
      assert_equal grit_assays_assay_models(:draft_model), @draft_sheet.assay_model
    end

    test "has many assay_data_sheet_columns" do
      assert_equal 2, @draft_sheet.assay_data_sheet_columns.count
      columns = @draft_sheet.assay_data_sheet_columns.order(:sort)
      assert_equal "concentration", columns.first.safe_name
      assert_equal "response", columns.second.safe_name
    end

    # --- Validations ---

    test "requires name" do
      sheet = AssayDataSheetDefinition.new(
        assay_model: grit_assays_assay_models(:draft_model),
        result: true
      )
      assert_not sheet.valid?
      assert_includes sheet.errors[:name], "can't be blank"
    end

    test "requires assay_model" do
      sheet = AssayDataSheetDefinition.new(
        name: "Test Sheet",
        result: true
      )
      assert_not sheet.valid?
      assert_includes sheet.errors[:assay_model], "must exist"
    end

    # --- Publication Status Check ---

    test "can modify sheet on draft model" do
      @draft_sheet.description = "Updated description"
      assert @draft_sheet.save
      assert_equal "Updated description", @draft_sheet.reload.description
    end

    test "cannot modify sheet on published model" do
      assert_raises(RuntimeError) do
        @published_sheet.update!(description: "Cannot change this")
      end
    end

    # --- Table Name ---

    test "table_name returns ds_{id}" do
      assert_equal "ds_#{@draft_sheet.id}", @draft_sheet.table_name
    end

    # --- Create/Drop Table ---

    test "create_table creates a PostgreSQL table" do
      # Create a fresh sheet to test table creation
      model = AssayModel.create!(
        name: "Table Create Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "Table Create Test Sheet",
        assay_model: model,
        result: true,
        sort: 1
      )

      AssayDataSheetColumn.create!(
        name: "Integer Col",
        safe_name: "int_col",
        assay_data_sheet_definition: sheet,
        data_type: grit_core_data_types(:integer),
        sort: 1,
        required: true
      )

      AssayDataSheetColumn.create!(
        name: "String Col",
        safe_name: "str_col",
        assay_data_sheet_definition: sheet,
        data_type: grit_core_data_types(:string),
        sort: 2,
        required: false
      )

      # Reload to get the columns association
      sheet.reload

      # Table should not exist
      assert_not ActiveRecord::Base.connection.table_exists?(sheet.table_name)

      # Create table
      sheet.create_table

      # Table should now exist
      assert ActiveRecord::Base.connection.table_exists?(sheet.table_name)

      # Verify columns exist
      columns = ActiveRecord::Base.connection.columns(sheet.table_name)
      column_names = columns.map(&:name)

      assert_includes column_names, "id"
      assert_includes column_names, "created_by"
      assert_includes column_names, "created_at"
      assert_includes column_names, "updated_by"
      assert_includes column_names, "updated_at"
      assert_includes column_names, "experiment_id"
      assert_includes column_names, "int_col"
      assert_includes column_names, "str_col"

      # Clean up
      sheet.drop_table
      model.destroy
    end

    test "drop_table removes the PostgreSQL table" do
      model = AssayModel.create!(
        name: "Table Drop Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "Table Drop Test Sheet",
        assay_model: model,
        result: true,
        sort: 1
      )

      # Create and verify
      sheet.create_table
      assert ActiveRecord::Base.connection.table_exists?(sheet.table_name)

      # Drop and verify
      sheet.drop_table
      assert_not ActiveRecord::Base.connection.table_exists?(sheet.table_name)

      model.destroy
    end

    test "drop_table handles non-existent table gracefully" do
      model = AssayModel.create!(
        name: "Non-existent Table Test",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "Non-existent Table Sheet",
        assay_model: model,
        result: true,
        sort: 1
      )

      # Should not raise error when table doesn't exist
      assert_nothing_raised do
        sheet.drop_table
      end

      model.destroy
    end

    # --- sheet_record_klass ---

    test "sheet_record_klass returns an ActiveRecord class" do
      model = AssayModel.create!(
        name: "Klass Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "Klass Test Sheet",
        assay_model: model,
        result: true,
        sort: 1
      )

      AssayDataSheetColumn.create!(
        name: "Value",
        safe_name: "value",
        assay_data_sheet_definition: sheet,
        data_type: grit_core_data_types(:integer),
        sort: 1,
        required: false
      )

      klass = sheet.sheet_record_klass

      # Verify it's a class inheriting from ActiveRecord::Base
      assert klass < ActiveRecord::Base

      # Verify table name is set correctly
      assert_equal sheet.table_name, klass.table_name

      model.destroy
    end

    test "sheet_record_klass can create and query records" do
      model = AssayModel.create!(
        name: "CRUD Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "CRUD Test Sheet",
        assay_model: model,
        result: true,
        sort: 1
      )

      AssayDataSheetColumn.create!(
        name: "Measurement",
        safe_name: "measurement",
        assay_data_sheet_definition: sheet,
        data_type: grit_core_data_types(:integer),
        sort: 1,
        required: false
      )

      # Reload sheet to get the columns association
      sheet.reload

      # Create the table FIRST
      sheet.create_table

      # Create an experiment to reference
      experiment = Experiment.create!(
        name: "CRUD Test Experiment",
        assay_model: model,
        publication_status: grit_core_publication_statuses(:draft)
      )

      # Get the dynamic class AFTER table creation so it knows the schema
      klass = sheet.sheet_record_klass
      klass.reset_column_information

      # Create a record
      record = klass.create!(
        experiment_id: experiment.id,
        measurement: 42
      )

      assert record.persisted?
      assert_equal 42, record.measurement
      assert_equal experiment.id, record.experiment_id
      assert_equal "admin", record.created_by

      # Query the record
      found = klass.find(record.id)
      assert_equal 42, found.measurement

      # Update the record
      found.update!(measurement: 100)
      assert_equal 100, found.reload.measurement

      # Delete the record
      found.destroy
      assert_not klass.exists?(record.id)

      # Clean up - use delete to avoid destroy_load_sets callback issues in tests
      sheet.drop_table
      Experiment.delete(experiment.id)
      model.destroy
    end

    test "sheet_record_klass responds to entity_properties" do
      model = AssayModel.create!(
        name: "Properties Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "Properties Test Sheet",
        assay_model: model,
        result: true,
        sort: 1
      )

      AssayDataSheetColumn.create!(
        name: "Test Value",
        safe_name: "test_value",
        assay_data_sheet_definition: sheet,
        data_type: grit_core_data_types(:integer),
        sort: 1,
        required: true
      )

      klass = sheet.sheet_record_klass

      # Test entity_properties method
      properties = klass.entity_properties

      property_names = properties.map { |p| p[:name] }
      assert_includes property_names, "created_at"
      assert_includes property_names, "created_by"
      assert_includes property_names, "updated_at"
      assert_includes property_names, "updated_by"
      assert_includes property_names, "test_value"

      model.destroy
    end

    test "sheet_record_klass detailed scope includes columns" do
      model = AssayModel.create!(
        name: "Detailed Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "Detailed Test Sheet",
        assay_model: model,
        result: true,
        sort: 1
      )

      AssayDataSheetColumn.create!(
        name: "Detail Value",
        safe_name: "detail_value",
        assay_data_sheet_definition: sheet,
        data_type: grit_core_data_types(:integer),
        sort: 1,
        required: false
      )

      # Reload sheet to get the columns association
      sheet.reload

      # Create table FIRST
      sheet.create_table

      experiment = Experiment.create!(
        name: "Detailed Test Experiment",
        assay_model: model,
        publication_status: grit_core_publication_statuses(:draft)
      )

      # Get the klass AFTER table creation
      klass = sheet.sheet_record_klass
      klass.reset_column_information

      # Create a record
      klass.create!(experiment_id: experiment.id, detail_value: 123)

      # Query with detailed scope
      result = klass.detailed.order(:id).first

      assert_not_nil result
      assert_respond_to result, :detail_value
      assert_equal 123, result.detail_value

      # Clean up - use delete to avoid destroy_load_sets callback issues in tests
      sheet.drop_table
      Experiment.delete(experiment.id)
      model.destroy
    end

    # --- Dependent Destroy ---

    test "destroying model destroys dependent sheet definitions via cascade" do
      # Test through the model since direct sheet.destroy may have FK issues
      # due to model's before_destroy :drop_tables callback
      model = AssayModel.create!(
        name: "Cascade Delete Test",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "Cascade Delete Sheet",
        assay_model: model,
        result: true,
        sort: 1
      )

      sheet_id = sheet.id

      model.destroy

      assert_not AssayDataSheetDefinition.exists?(sheet_id)
    end

    test "sheet has_many columns with dependent destroy" do
      # Verify the association exists and is configured correctly
      reflection = AssayDataSheetDefinition.reflect_on_association(:assay_data_sheet_columns)
      assert_not_nil reflection
      assert_equal :destroy, reflection.options[:dependent]
    end
  end
end
