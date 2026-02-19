# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class ExperimentMetadatumTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @draft_experiment_species = grit_assays_experiment_metadata(:draft_experiment_species)
      @published_experiment_species = grit_assays_experiment_metadata(:published_experiment_species)
      @draft_experiment = grit_assays_experiments(:draft_experiment)
    end

    # --- Fixtures ---

    test "fixtures load correctly" do
      assert_not_nil @draft_experiment_species
      assert_not_nil @published_experiment_species
    end

    # --- Associations ---

    test "belongs to assay_metadata_definition" do
      assert_equal grit_assays_assay_metadata_definitions(:species), @draft_experiment_species.assay_metadata_definition
    end

    test "belongs to experiment" do
      assert_equal @draft_experiment, @draft_experiment_species.experiment
    end

    test "belongs to vocabulary" do
      assert_equal grit_core_vocabularies(:one), @draft_experiment_species.vocabulary
    end

    test "belongs to vocabulary_item" do
      assert_equal grit_core_vocabulary_items(:oneone), @draft_experiment_species.vocabulary_item
    end

    # --- Validations ---

    test "requires experiment" do
      metadata = ExperimentMetadatum.new(
        assay_metadata_definition: grit_assays_assay_metadata_definitions(:species),
        vocabulary: grit_core_vocabularies(:one),
        vocabulary_item: grit_core_vocabulary_items(:oneone)
      )
      assert_not metadata.valid?
      assert_includes metadata.errors[:experiment], "must exist"
    end

    test "requires assay_metadata_definition" do
      metadata = ExperimentMetadatum.new(
        experiment: @draft_experiment,
        vocabulary: grit_core_vocabularies(:one),
        vocabulary_item: grit_core_vocabulary_items(:oneone)
      )
      assert_not metadata.valid?
      assert_includes metadata.errors[:assay_metadata_definition], "must exist"
    end

    test "requires vocabulary" do
      metadata = ExperimentMetadatum.new(
        experiment: @draft_experiment,
        assay_metadata_definition: grit_assays_assay_metadata_definitions(:tissue_type),
        vocabulary_item: grit_core_vocabulary_items(:oneone)
      )
      assert_not metadata.valid?
      assert_includes metadata.errors[:vocabulary], "must exist"
    end

    test "requires vocabulary_item" do
      metadata = ExperimentMetadatum.new(
        experiment: @draft_experiment,
        assay_metadata_definition: grit_assays_assay_metadata_definitions(:tissue_type),
        vocabulary: grit_core_vocabularies(:one)
      )
      assert_not metadata.valid?
      assert_includes metadata.errors[:vocabulary_item], "must exist"
    end

    test "allows creation with valid attributes" do
      # Create a new experiment so we can add fresh metadata
      experiment = Experiment.create!(
        name: "Metadata Test Experiment",
        assay_model: grit_assays_assay_models(:draft_model),
        publication_status: grit_core_publication_statuses(:draft)
      )

      metadata = ExperimentMetadatum.new(
        experiment: experiment,
        assay_metadata_definition: grit_assays_assay_metadata_definitions(:tissue_type),
        vocabulary: grit_core_vocabularies(:one),
        vocabulary_item: grit_core_vocabulary_items(:onetwo)
      )
      assert metadata.valid?

      experiment.destroy
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = ExperimentMetadatum.entity_crud

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
  end
end
