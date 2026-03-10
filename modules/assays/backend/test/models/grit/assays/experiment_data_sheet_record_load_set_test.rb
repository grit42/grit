# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  # NOTE: This test file tests ExperimentDataSheetRecordLoadSetBlock.
  # The file name references "load_set" but the actual model is LoadSetBlock.
  class ExperimentDataSheetRecordLoadSetTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
    end

    # --- Basic Model Behavior ---

    test "ExperimentDataSheetRecordLoadSetBlock class exists and includes GritEntityRecord" do
      assert defined?(ExperimentDataSheetRecordLoadSetBlock)
      assert ExperimentDataSheetRecordLoadSetBlock.include?(Grit::Core::GritEntityRecord)
    end

    # --- Associations ---

    test "belongs to load_set_block" do
      association = ExperimentDataSheetRecordLoadSetBlock.reflect_on_association(:load_set_block)
      assert association.present?
      assert_equal :belongs_to, association.macro
      assert_equal "Grit::Core::LoadSetBlock", association.options[:class_name]
    end

    test "belongs to assay_data_sheet_definition" do
      association = ExperimentDataSheetRecordLoadSetBlock.reflect_on_association(:assay_data_sheet_definition)
      assert association.present?
      assert_equal :belongs_to, association.macro
    end

    # --- entity_fields ---

    test "entity_fields filters to experiment_id and assay_data_sheet_definition_id" do
      fields = ExperimentDataSheetRecordLoadSetBlock.entity_fields
      field_names = fields.map { |f| f[:name] }

      assert_includes field_names, "experiment_id"
      assert_includes field_names, "assay_data_sheet_definition_id"
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = ExperimentDataSheetRecordLoadSetBlock.entity_crud

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

    # Note: Full testing of load set blocks requires load_set fixtures from
    # core module and integration with the data loading pipeline.
  end
end
