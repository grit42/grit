# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableRowTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
    end

    # --- Basic Model Behavior ---

    test "DataTableRow class exists and includes GritEntityRecord" do
      assert defined?(DataTableRow)
      assert DataTableRow.include?(Grit::Core::GritEntityRecord)
    end

    test "uses data_table_entities table" do
      assert_equal "grit_assays_data_table_entities", DataTableRow.table_name
    end

    # --- Class Methods ---

    test "for_data_table class method exists" do
      assert DataTableRow.respond_to?(:for_data_table)
    end

    test "full_perspective class method exists" do
      assert DataTableRow.respond_to?(:full_perspective)
    end

    test "detailed class method exists" do
      assert DataTableRow.respond_to?(:detailed)
    end

    test "detailed requires data_table_id" do
      error = assert_raises(RuntimeError) do
        DataTableRow.detailed({})
      end
      assert_match(/'data_table_id' is required/, error.message)
    end

    # --- CRUD Permissions ---

    test "entity_crud_with allows read for everyone" do
      crud = DataTableRow.entity_crud

      assert_empty crud[:read]
    end

    # Note: DataTableRow is a virtual model that uses DataTableEntity table
    # and generates dynamic columns based on DataTableColumn configurations.
    # Full testing requires data tables with entity data types and columns.
  end
end
