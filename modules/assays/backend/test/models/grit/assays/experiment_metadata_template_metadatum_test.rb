# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class ExperimentMetadataTemplateMetadatumTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
    end

    # --- Basic Model Behavior ---

    test "ExperimentMetadataTemplateMetadatum class exists and includes GritEntityRecord" do
      assert defined?(ExperimentMetadataTemplateMetadatum)
      assert ExperimentMetadataTemplateMetadatum.include?(Grit::Core::GritEntityRecord)
    end

    # --- Associations ---

    test "belongs to assay_metadata_definition" do
      assert ExperimentMetadataTemplateMetadatum.reflect_on_association(:assay_metadata_definition).present?
      assert_equal :belongs_to, ExperimentMetadataTemplateMetadatum.reflect_on_association(:assay_metadata_definition).macro
    end

    test "belongs to experiment_metadata_template" do
      assert ExperimentMetadataTemplateMetadatum.reflect_on_association(:experiment_metadata_template).present?
      assert_equal :belongs_to, ExperimentMetadataTemplateMetadatum.reflect_on_association(:experiment_metadata_template).macro
    end

    test "belongs to vocabulary" do
      assert ExperimentMetadataTemplateMetadatum.reflect_on_association(:vocabulary).present?
      assert_equal :belongs_to, ExperimentMetadataTemplateMetadatum.reflect_on_association(:vocabulary).macro
    end

    test "belongs to vocabulary_item" do
      assert ExperimentMetadataTemplateMetadatum.reflect_on_association(:vocabulary_item).present?
      assert_equal :belongs_to, ExperimentMetadataTemplateMetadatum.reflect_on_association(:vocabulary_item).macro
    end

    # --- after_destroy callback ---

    test "destroying last metadatum destroys the template" do
      template = ExperimentMetadataTemplate.create!(
        name: "Destroy Callback Template",
        description: "Template for destroy callback test"
      )

      species_def = grit_assays_assay_metadata_definitions(:species)
      vocab_item = grit_core_vocabulary_items(:oneone)

      # Create metadata via set_metadata_values
      template.set_metadata_values(species_def.safe_name => vocab_item.id)
      template.reload

      metadatum = template.experiment_metadata_template_metadata.first
      assert_not_nil metadatum

      template_id = template.id

      # Destroying the only metadatum should also destroy the template
      metadatum.destroy

      assert_not ExperimentMetadataTemplate.exists?(template_id)
    end

    test "destroying one metadatum does not destroy template with remaining metadata" do
      template = ExperimentMetadataTemplate.create!(
        name: "Multiple Metadata Template",
        description: "Template with multiple metadata"
      )

      species_def = grit_assays_assay_metadata_definitions(:species)
      tissue_def = grit_assays_assay_metadata_definitions(:tissue_type)
      vocab_item_one = grit_core_vocabulary_items(:oneone)
      vocab_item_two = grit_core_vocabulary_items(:onetwo)

      # Create two metadata entries
      template.set_metadata_values(
        species_def.safe_name => vocab_item_one.id,
        tissue_def.safe_name => vocab_item_two.id
      )
      template.reload

      assert_equal 2, template.experiment_metadata_template_metadata.count

      # Destroy one metadatum
      species_metadatum = template.experiment_metadata_template_metadata.find_by(
        assay_metadata_definition: species_def
      )
      species_metadatum.destroy

      # Template should still exist
      assert ExperimentMetadataTemplate.exists?(template.id)
      assert_equal 1, template.reload.experiment_metadata_template_metadata.count

      template.destroy
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = ExperimentMetadataTemplateMetadatum.entity_crud

      assert_includes crud[:create], "Administrator"
      assert_includes crud[:create], "AssayAdministrator"
      assert_includes crud[:update], "Administrator"
      assert_includes crud[:update], "AssayAdministrator"
      assert_includes crud[:destroy], "Administrator"
      assert_includes crud[:destroy], "AssayAdministrator"
      assert_empty crud[:read]
    end
  end
end
