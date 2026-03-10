# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class ExperimentTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @draft_experiment = grit_assays_experiments(:draft_experiment)
      @published_experiment = grit_assays_experiments(:published_experiment)
    end

    # --- Fixtures ---

    test "fixtures load correctly" do
      assert_not_nil @draft_experiment
      assert_not_nil @published_experiment
      assert_equal "Draft Kinase Experiment 001", @draft_experiment.name
      assert_equal "Published Viability Experiment 001", @published_experiment.name
    end

    # --- Associations ---

    test "belongs to assay_model" do
      assert_equal grit_assays_assay_models(:draft_model), @draft_experiment.assay_model
    end

    test "belongs to publication_status" do
      assert_equal grit_core_publication_statuses(:draft), @draft_experiment.publication_status
      assert_equal grit_core_publication_statuses(:published), @published_experiment.publication_status
    end

    test "has many experiment_metadata" do
      assert_respond_to @draft_experiment, :experiment_metadata
      # Draft experiment has 1 metadata (species)
      assert_equal 1, @draft_experiment.experiment_metadata.count
      # Published experiment has 2 metadata (species and tissue_type)
      assert_equal 2, @published_experiment.experiment_metadata.count
    end

    # --- Validations ---

    test "requires name" do
      experiment = Experiment.new(
        assay_model: grit_assays_assay_models(:draft_model),
        publication_status: grit_core_publication_statuses(:draft)
      )
      assert_not experiment.valid?
      assert_includes experiment.errors[:name], "can't be blank"
    end

    test "requires assay_model" do
      experiment = Experiment.new(
        name: "Test Experiment",
        publication_status: grit_core_publication_statuses(:draft)
      )
      assert_not experiment.valid?
      assert_includes experiment.errors[:assay_model], "must exist"
    end

    # --- Publication Status Callback ---

    test "draft experiment can be modified" do
      @draft_experiment.description = "Updated description"
      assert @draft_experiment.save
      assert_equal "Updated description", @draft_experiment.reload.description
    end

    test "published experiment cannot be modified" do
      # Use a fresh record to avoid affecting the fixture
      experiment = Experiment.find(@published_experiment.id)

      error = assert_raises do
        experiment.update!(description: "Cannot change this")
      end

      assert_match(/Cannot modify a published Experiment/, error.message)
    end

    test "published experiment can change publication_status" do
      @published_experiment.publication_status = grit_core_publication_statuses(:draft)
      assert @published_experiment.save
    end

    # --- set_metadata_values ---

    test "set_metadata_values creates new metadata" do
      experiment = Experiment.create!(
        name: "Metadata Test Experiment",
        assay_model: grit_assays_assay_models(:draft_model),
        publication_status: grit_core_publication_statuses(:draft)
      )

      species_def = grit_assays_assay_metadata_definitions(:species)
      vocab_item = grit_core_vocabulary_items(:oneone)

      result = experiment.set_metadata_values(species_def.safe_name => vocab_item.id)

      assert result
      experiment.reload
      metadata = experiment.experiment_metadata.find_by(assay_metadata_definition: species_def)
      assert_not_nil metadata
      assert_equal vocab_item.id, metadata.vocabulary_item_id
    end

    test "set_metadata_values updates existing metadata" do
      species_def = grit_assays_assay_metadata_definitions(:species)
      new_vocab_item = grit_core_vocabulary_items(:onetwo)

      # Draft experiment already has species metadata
      original_metadata = @draft_experiment.experiment_metadata.find_by(
        assay_metadata_definition: species_def
      )
      assert_not_nil original_metadata
      original_item_id = original_metadata.vocabulary_item_id

      # Update to new value
      result = @draft_experiment.set_metadata_values(species_def.safe_name => new_vocab_item.id)

      assert result
      @draft_experiment.reload
      updated_metadata = @draft_experiment.experiment_metadata.find_by(
        assay_metadata_definition: species_def
      )
      assert_equal new_vocab_item.id, updated_metadata.vocabulary_item_id
      assert_not_equal original_item_id, updated_metadata.vocabulary_item_id
    end

    test "set_metadata_values removes metadata when value is blank" do
      species_def = grit_assays_assay_metadata_definitions(:species)

      # Draft experiment has species metadata
      assert @draft_experiment.experiment_metadata.exists?(assay_metadata_definition: species_def)

      # Set to blank to remove
      result = @draft_experiment.set_metadata_values(species_def.safe_name => "")

      assert result
      @draft_experiment.reload
      assert_not @draft_experiment.experiment_metadata.exists?(assay_metadata_definition: species_def)
    end

    test "set_metadata_values handles nil values" do
      species_def = grit_assays_assay_metadata_definitions(:species)

      # Draft experiment has species metadata
      assert @draft_experiment.experiment_metadata.exists?(assay_metadata_definition: species_def)

      # Set to nil to remove
      result = @draft_experiment.set_metadata_values(species_def.safe_name => nil)

      assert result
      @draft_experiment.reload
      assert_not @draft_experiment.experiment_metadata.exists?(assay_metadata_definition: species_def)
    end

    # --- Detailed Scope ---

    test "detailed scope includes publication status" do
      result = Experiment.detailed.find(@draft_experiment.id)
      assert_respond_to result, :publication_status_id__name
      assert_equal "Draft", result.publication_status_id__name
    end

    test "detailed scope includes assay model info" do
      result = Experiment.detailed.find(@draft_experiment.id)
      assert_respond_to result, :assay_model_id__name
      assert_equal "Draft Kinase Assay", result.assay_model_id__name
    end

    test "detailed scope includes assay type info" do
      result = Experiment.detailed.find(@draft_experiment.id)
      assert_respond_to result, :assay_type_id__name
      assert_equal "Biochemical", result.assay_type_id__name
    end

    test "detailed scope includes metadata values" do
      species_def = grit_assays_assay_metadata_definitions(:species)

      result = Experiment.detailed.find(@draft_experiment.id)
      # Metadata is joined as columns with safe_name
      assert_respond_to result, species_def.safe_name.to_sym
    end

    # --- delete_records ---

    test "delete_records removes records from dynamic tables" do
      # Create a model with a sheet
      model = AssayModel.create!(
        name: "Delete Records Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "Delete Records Test Sheet",
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

      # Reload sheet to get columns
      sheet.reload

      # Create the dynamic table
      sheet.create_table

      # Create an experiment
      experiment = Experiment.create!(
        name: "Delete Records Test Experiment",
        assay_model: model,
        publication_status: grit_core_publication_statuses(:draft)
      )

      # Get the klass and reset column info after table creation
      klass = sheet.sheet_record_klass
      klass.reset_column_information

      # Insert a record into the dynamic table
      klass.create!(experiment_id: experiment.id, value: 42)

      assert_equal 1, klass.where(experiment_id: experiment.id).count

      # Call delete_records
      experiment.delete_records

      assert_equal 0, klass.where(experiment_id: experiment.id).count

      # Clean up - drop table first, then delete records manually
      # to avoid the destroy_load_sets callback issues
      sheet.drop_table
      Experiment.delete(experiment.id)
      model.destroy
    end

    # --- before_destroy Callbacks ---

    test "before_destroy removes records from dynamic tables" do
      model = AssayModel.create!(
        name: "Destroy Experiment Test Model",
        assay_type: grit_assays_assay_types(:biochemical),
        publication_status: grit_core_publication_statuses(:draft)
      )

      sheet = AssayDataSheetDefinition.create!(
        name: "Destroy Experiment Test Sheet",
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

      sheet.reload
      sheet.create_table

      experiment = Experiment.create!(
        name: "Destroy Experiment Test",
        assay_model: model,
        publication_status: grit_core_publication_statuses(:draft)
      )

      klass = sheet.sheet_record_klass
      klass.reset_column_information
      klass.create!(experiment_id: experiment.id, value: 123)
      assert_equal 1, klass.count

      # Destroy the experiment — the before_destroy callback should call delete_records
      experiment.destroy

      assert_equal 0, klass.where(experiment_id: experiment.id).count,
        "before_destroy should have removed dynamic table records via delete_records"

      # Clean up
      sheet.drop_table
      model.destroy
    end

    # --- Dependent Destroy ---

    test "destroying experiment destroys dependent metadata" do
      experiment = Experiment.create!(
        name: "Dependent Metadata Test",
        assay_model: grit_assays_assay_models(:draft_model),
        publication_status: grit_core_publication_statuses(:draft)
      )

      species_def = grit_assays_assay_metadata_definitions(:species)
      metadata = ExperimentMetadatum.create!(
        experiment: experiment,
        assay_metadata_definition: species_def,
        vocabulary: species_def.vocabulary,
        vocabulary_item: grit_core_vocabulary_items(:oneone)
      )

      metadata_id = metadata.id

      experiment.destroy

      assert_not ExperimentMetadatum.exists?(metadata_id)
    end

    # --- Entity Properties ---

    test "entity_properties excludes plots field" do
      properties = Experiment.entity_properties
      property_names = properties.map { |p| p[:name] }

      assert_not_includes property_names, "plots"
    end

    # --- Metadata Properties ---

    test "metadata_properties returns metadata definitions" do
      properties = Experiment.metadata_properties(assay_model_id: grit_assays_assay_models(:draft_model).id)

      assert properties.is_a?(Array)
      property_names = properties.map { |p| p[:name] }

      # Should include our defined metadata definitions
      assert_includes property_names, "species"
      assert_includes property_names, "tissue_type"
    end

    test "metadata_properties marks required metadata based on assay model" do
      # The draft_model has species as required metadata (from assay_model_metadata fixture)
      properties = Experiment.metadata_properties(assay_model_id: grit_assays_assay_models(:draft_model).id)

      species_prop = properties.find { |p| p[:name] == "species" }
      assert_not_nil species_prop
      assert species_prop[:required], "Species should be required for draft_model"
    end
  end
end
