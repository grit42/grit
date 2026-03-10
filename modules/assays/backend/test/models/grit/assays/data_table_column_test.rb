# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableColumnTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
    end

    # --- Basic Model Behavior ---

    test "DataTableColumn class exists and includes GritEntityRecord" do
      assert defined?(DataTableColumn)
      assert DataTableColumn.include?(Grit::Core::GritEntityRecord)
    end

    # --- Associations ---

    test "belongs to data_table" do
      assert DataTableColumn.reflect_on_association(:data_table).present?
      assert_equal :belongs_to, DataTableColumn.reflect_on_association(:data_table).macro
    end

    test "belongs to assay_data_sheet_column (optional)" do
      association = DataTableColumn.reflect_on_association(:assay_data_sheet_column)
      assert association.present?
      assert_equal :belongs_to, association.macro
      assert association.options[:optional]
    end

    # --- Validations ---

    test "requires name minimum length of 1" do
      column = DataTableColumn.new(
        name: "",
        safe_name: "valid_safe",
        data_table_id: 1
      )
      assert_not column.valid?
      assert column.errors[:name].any? { |e| e.include?("too short") }
    end

    test "requires safe_name minimum length of 3" do
      column = DataTableColumn.new(
        name: "Valid Name",
        safe_name: "ab",
        data_table_id: 1
      )
      assert_not column.valid?
      assert column.errors[:safe_name].any? { |e| e.include?("too short") }
    end

    # --- Class Methods ---

    test "detailed class method exists" do
      assert DataTableColumn.respond_to?(:detailed)
    end

    test "selected class method exists" do
      assert DataTableColumn.respond_to?(:selected)
    end

    test "available_entity_attributes class method exists" do
      assert DataTableColumn.respond_to?(:available_entity_attributes)
    end

    test "available class method exists" do
      assert DataTableColumn.respond_to?(:available)
    end

    # --- Instance Methods ---

    test "data_table_statement instance method exists" do
      column = DataTableColumn.new
      assert column.respond_to?(:data_table_statement)
    end

    test "sql_aggregate_method instance method exists" do
      column = DataTableColumn.new
      assert column.respond_to?(:sql_aggregate_method)
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = DataTableColumn.entity_crud

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

    # Note: Full DataTableColumn testing requires a DataTable with an entity
    # data type pointing to a real model. These tests focus on model structure
    # and validations that don't require database records.
  end
end
