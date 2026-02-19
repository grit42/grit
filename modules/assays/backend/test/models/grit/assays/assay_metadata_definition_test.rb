# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayMetadataDefinitionTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @species = grit_assays_assay_metadata_definitions(:species)
      @tissue_type = grit_assays_assay_metadata_definitions(:tissue_type)
    end

    # --- Fixtures ---

    test "fixtures load correctly" do
      assert_not_nil @species
      assert_not_nil @tissue_type
      assert_equal "Species", @species.name
      assert_equal "species", @species.safe_name
    end

    # --- Associations ---

    test "belongs to vocabulary" do
      assert_equal grit_core_vocabularies(:one), @species.vocabulary
    end

    test "has many experiment_metadata" do
      assert_respond_to @species, :experiment_metadata
      assert_kind_of ActiveRecord::Associations::CollectionProxy, @species.experiment_metadata
    end

    test "has many experiment_metadata_template_metadata" do
      assert_respond_to @species, :experiment_metadata_template_metadata
      assert_kind_of ActiveRecord::Associations::CollectionProxy, @species.experiment_metadata_template_metadata
    end

    # --- Validations ---

    test "requires safe_name to be unique" do
      definition = AssayMetadataDefinition.new(
        name: "Duplicate Safe Name",
        safe_name: @species.safe_name,
        vocabulary: grit_core_vocabularies(:one)
      )
      assert_not definition.valid?
      assert_includes definition.errors[:safe_name], "has already been taken"
    end

    test "requires safe_name minimum length of 3" do
      definition = AssayMetadataDefinition.new(
        name: "Too Short",
        safe_name: "ab",
        vocabulary: grit_core_vocabularies(:one)
      )
      assert_not definition.valid?
      assert definition.errors[:safe_name].any? { |e| e.include?("too short") }
    end

    test "requires safe_name maximum length of 30" do
      definition = AssayMetadataDefinition.new(
        name: "Too Long",
        safe_name: "a" * 31,
        vocabulary: grit_core_vocabularies(:one)
      )
      assert_not definition.valid?
      assert definition.errors[:safe_name].any? { |e| e.include?("too long") }
    end

    test "requires safe_name to start with lowercase letters or underscores" do
      definition = AssayMetadataDefinition.new(
        name: "Bad Start",
        safe_name: "1_bad_start",
        vocabulary: grit_core_vocabularies(:one)
      )
      assert_not definition.valid?
      assert definition.errors[:safe_name].any? { |e| e.include?("should start with two lowercase letters") }
    end

    test "requires safe_name to contain only lowercase letters, numbers and underscores" do
      definition = AssayMetadataDefinition.new(
        name: "Bad Characters",
        safe_name: "bad-chars",
        vocabulary: grit_core_vocabularies(:one)
      )
      assert_not definition.valid?
      assert definition.errors[:safe_name].any? { |e| e.include?("should contain only lowercase letters") }
    end

    test "safe_name cannot conflict with Experiment methods" do
      definition = AssayMetadataDefinition.new(
        name: "Name Conflict",
        safe_name: "name",
        vocabulary: grit_core_vocabularies(:one)
      )
      assert_not definition.valid?
      assert definition.errors[:safe_name].any? { |e| e.include?("cannot be used") }
    end

    test "allows creation with valid attributes" do
      definition = AssayMetadataDefinition.new(
        name: "Valid Definition",
        safe_name: "valid_definition",
        description: "A valid metadata definition",
        vocabulary: grit_core_vocabularies(:one)
      )
      assert definition.valid?
    end

    # --- Callbacks ---

    test "cannot modify metadata definition in use by assay model" do
      # species is used in assay_model_metadata fixture
      assert_raises(RuntimeError) do
        @species.update!(name: "Changed Species")
      end
    end

    test "cannot destroy metadata definition required in assay model" do
      # species is linked via assay_model_metadata fixture
      assert_raises(RuntimeError) do
        @species.destroy!
      end
    end

    # --- by_assay_model scope ---

    test "by_assay_model returns metadata for specific assay model" do
      draft_model = grit_assays_assay_models(:draft_model)

      result = AssayMetadataDefinition.by_assay_model("assay_model_id" => draft_model.id)

      assert result.any?
      safe_names = result.map(&:safe_name)
      assert_includes safe_names, "species"
    end

    test "by_assay_model raises error without assay_model_id" do
      assert_raises(RuntimeError) do
        AssayMetadataDefinition.by_assay_model({})
      end
    end

    # --- Display Column ---

    test "has entity properties configured" do
      properties = AssayMetadataDefinition.entity_properties
      assert properties.any?
      property_names = properties.map { |p| p[:name] }
      assert_includes property_names, "name"
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = AssayMetadataDefinition.entity_crud

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
