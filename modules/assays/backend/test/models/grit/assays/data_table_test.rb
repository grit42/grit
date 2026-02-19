# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
    end

    # --- Basic Model Behavior ---

    test "DataTable class exists and includes GritEntityRecord" do
      assert defined?(DataTable)
      assert DataTable.include?(Grit::Core::GritEntityRecord)
    end

    test "belongs to entity_data_type" do
      assert DataTable.reflect_on_association(:entity_data_type).present?
      assert_equal :belongs_to, DataTable.reflect_on_association(:entity_data_type).macro
    end

    # --- Entity Properties ---

    test "entity_properties excludes plots field" do
      properties = DataTable.entity_properties
      property_names = properties.map { |p| p[:name] }

      assert_not_includes property_names, "plots"
    end

    test "entity_properties includes entity_data_type_id with scope param" do
      properties = DataTable.entity_properties
      entity_data_type_prop = properties.find { |p| p[:name] == "entity_data_type_id" }

      assert_not_nil entity_data_type_prop
      assert_equal "entity_data_types", entity_data_type_prop.dig(:entity, :params, :scope)
    end

    # --- Callbacks ---

    test "delete_dependents callback exists" do
      # Verify the callback is defined
      assert DataTable.method_defined?(:delete_dependents)
    end

    test "add_entity_type_display_columns callback exists" do
      # Verify the callback is defined
      assert DataTable.method_defined?(:add_entity_type_display_columns)
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = DataTable.entity_crud

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

    # Note: Full DataTable testing with actual entity data types requires
    # entity data types that point to real models (e.g., Compound, Batch).
    # This requires seeds to be loaded or complex fixture setup.
    # These tests focus on the model structure and callbacks.
  end
end
