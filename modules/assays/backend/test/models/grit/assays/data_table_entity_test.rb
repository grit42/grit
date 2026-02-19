# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableEntityTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
    end

    # --- Basic Model Behavior ---

    test "DataTableEntity class exists and includes GritEntityRecord" do
      assert defined?(DataTableEntity)
      assert DataTableEntity.include?(Grit::Core::GritEntityRecord)
    end

    # --- Validations ---

    test "entity_id must be unique within data_table" do
      # Verify the uniqueness validation is configured
      validators = DataTableEntity.validators_on(:entity_id)
      uniqueness_validator = validators.find { |v| v.is_a?(ActiveRecord::Validations::UniquenessValidator) }

      assert_not_nil uniqueness_validator
      assert_equal :data_table_id, uniqueness_validator.options[:scope]
    end

    # --- Class Methods ---

    test "entity_properties class method exists" do
      assert DataTableEntity.respond_to?(:entity_properties)
    end

    test "entity_fields class method exists" do
      assert DataTableEntity.respond_to?(:entity_fields)
    end

    test "entity_columns class method exists" do
      assert DataTableEntity.respond_to?(:entity_columns)
    end

    test "detailed class method exists" do
      assert DataTableEntity.respond_to?(:detailed)
    end

    test "available class method exists" do
      assert DataTableEntity.respond_to?(:available)
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = DataTableEntity.entity_crud

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

    # Note: DataTableEntity links entities to data tables. Full testing
    # requires data tables with entity data types pointing to real models.
  end
end
