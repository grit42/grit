# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayModelMetadatumTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @draft_model_species = grit_assays_assay_model_metadata(:draft_model_species)
      @published_model_species = grit_assays_assay_model_metadata(:published_model_species)
      @draft_model = grit_assays_assay_models(:draft_model)
      @published_model = grit_assays_assay_models(:published_model)
    end

    # --- Fixtures ---

    test "fixtures load correctly" do
      assert_not_nil @draft_model_species
      assert_not_nil @published_model_species
    end

    # --- Associations ---

    test "belongs to assay_metadata_definition" do
      assert_equal grit_assays_assay_metadata_definitions(:species), @draft_model_species.assay_metadata_definition
    end

    test "belongs to assay_model" do
      assert_equal @draft_model, @draft_model_species.assay_model
    end

    # --- Callbacks ---

    test "has before_save callbacks configured" do
      callbacks = AssayModelMetadatum._save_callbacks.select { |c| c.kind == :before }
      assert callbacks.any?, "AssayModelMetadatum should have before_save callbacks"
    end

    test "AssayModelMetadatum associations are configured" do
      # Test that associations exist
      assert AssayModelMetadatum.reflect_on_association(:assay_metadata_definition).present?
      assert AssayModelMetadatum.reflect_on_association(:assay_model).present?
    end

    test "cannot create metadata link on published assay model" do
      # The tissue_type is already linked to published_model, so we need a fresh definition
      definition = AssayMetadataDefinition.create!(
        name: "New Definition",
        safe_name: "new_definition",
        vocabulary: grit_core_vocabularies(:one)
      )

      assert_raises(RuntimeError) do
        AssayModelMetadatum.create!(
          assay_model: @published_model,
          assay_metadata_definition: definition
        )
      end

      definition.destroy
    end

    test "can create metadata link on draft assay model" do
      definition = AssayMetadataDefinition.create!(
        name: "Another Definition",
        safe_name: "another_def",
        vocabulary: grit_core_vocabularies(:one)
      )

      link = AssayModelMetadatum.new(
        assay_model: @draft_model,
        assay_metadata_definition: definition
      )

      assert link.save

      # Cleanup
      link.destroy
      definition.destroy
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = AssayModelMetadatum.entity_crud

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
