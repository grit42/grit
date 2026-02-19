# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayTypeTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @assay_type = grit_assays_assay_types(:biochemical)
    end

    # --- Fixtures ---

    test "fixtures load correctly" do
      assert_not_nil @assay_type
      assert_equal "Biochemical", @assay_type.name
      assert_not_nil grit_assays_assay_types(:cellular)
      assert_not_nil grit_assays_assay_types(:in_vivo)
    end

    # --- Associations ---

    test "has many assay_models" do
      assert_respond_to @assay_type, :assay_models
      assert_kind_of ActiveRecord::Associations::CollectionProxy, @assay_type.assay_models
    end

    test "destroying assay_type destroys dependent assay_models" do
      # Create a new assay type with an assay model
      assay_type = AssayType.create!(name: "Test Type", description: "Test")
      model = AssayModel.create!(
        name: "Test Model",
        assay_type: assay_type,
        publication_status: grit_core_publication_statuses(:draft)
      )
      model_id = model.id

      assay_type.destroy

      assert_not AssayModel.exists?(model_id)
    end

    # --- Validations ---

    test "requires name" do
      assay_type = AssayType.new(description: "Test")
      assert_not assay_type.valid?
      assert_includes assay_type.errors[:name], "can't be blank"
    end

    test "allows creation with valid attributes" do
      assay_type = AssayType.new(name: "New Type", description: "A new assay type")
      assert assay_type.valid?
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = AssayType.entity_crud

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
