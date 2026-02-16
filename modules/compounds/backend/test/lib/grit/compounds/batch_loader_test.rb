require "test_helper"

module Grit::Compounds
  class BatchLoaderTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @compound_type = grit_compounds_compound_types(:screening)
      @compound = grit_compounds_compounds(:one)
      @origin = grit_core_origins(:one)
    end

    # =========================================================================
    # Block Fields Tests
    # =========================================================================

    test "should return block fields including batch-specific fields" do
      params = { entity: "Grit::Compounds::Batch" }
      fields = BatchLoader.block_fields(params)

      field_names = fields.map { |f| f[:name] }
      assert_includes field_names, "name"
      assert_includes field_names, "separator"
      assert_includes field_names, "compound_type_id"
    end

    test "should return block set data fields" do
      params = { entity: "Grit::Compounds::Batch" }
      fields = BatchLoader.block_set_data_fields(params)

      # Should return base fields
      assert fields.is_a?(Array)
    end

    test "should return mapping fields for batch type" do
      compound_type = grit_compounds_compound_types(:screening)

      # Test the entity_fields method directly
      mapping_fields = Grit::Compounds::Batch.entity_fields(compound_type_id: compound_type.id)
      field_names = mapping_fields.map { |f| f[:name] }

      # Should include batch fields
      assert_includes field_names, "name"
      assert_includes field_names, "compound_id"
    end

    test "should return loading fields for batch type" do
      compound_type = grit_compounds_compound_types(:screening)

      # Test the entity_fields method directly
      loading_fields = Grit::Compounds::Batch.entity_fields(compound_type_id: compound_type.id)
      field_names = loading_fields.map { |f| f[:name] }

      # Should include batch fields
      assert_includes field_names, "name"
      assert_includes field_names, "compound_id"
    end

    # =========================================================================
    # validate_record Tests
    # =========================================================================

    test "validate_record should validate batch property values" do
      # Use existing string property from fixtures to test validation flow
      string_property = grit_compounds_batch_properties(:one)

      context = {
        batch_properties: [ string_property ],
        db_property_names: Grit::Compounds::Batch.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "test_batch",
        "compound_id" => @compound.id,
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id,
        "one" => "valid_string_value"
      }

      BatchLoader.send(:validate_record, Grit::Compounds::Batch, record, record_props, context)

      # String property with string value should pass validation
      assert_nil record[:record_errors], "Valid string property value should not produce errors"
    end

    test "validate_record should pass with valid record data" do
      context = {
        batch_properties: Grit::Compounds::BatchProperty.where(compound_type_id: [ @compound_type.id, nil ]),
        db_property_names: Grit::Compounds::Batch.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "valid_batch",
        "compound_id" => @compound.id,
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id
      }

      result = BatchLoader.send(:validate_record, Grit::Compounds::Batch, record, record_props, context)

      assert_not result[:has_warnings], "Should not have warnings for valid batch"
      assert_nil record[:record_errors], "Should not have errors for valid batch"
    end

    test "validate_record should handle nil property values for required properties" do
      # Use existing required string property from fixtures
      # Property "one" is required: true in the fixtures
      required_property = grit_compounds_batch_properties(:one)

      context = {
        batch_properties: [ required_property ],
        db_property_names: Grit::Compounds::Batch.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "test_batch",
        "compound_id" => @compound.id,
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id
        # Note: "one" property is not provided (nil)
      }

      # validate_record does not check for required on nil values
      # (required validation happens elsewhere in the workflow)
      result = BatchLoader.send(:validate_record, Grit::Compounds::Batch, record, record_props, context)

      assert_not result[:has_warnings]
      # Nil values are skipped in validate_record, so no errors
      assert_nil record[:record_errors]
    end

    # =========================================================================
    # validate_block_context Tests
    # =========================================================================

    test "validate_block_context should return batch_properties and db_property_names" do
      load_set_block = grit_core_load_set_blocks(:batch_loading_validated_block)

      context = BatchLoader.send(:validate_block_context, load_set_block)

      assert_not_nil context[:batch_properties]
      assert_not_nil context[:db_property_names]
      assert_includes context[:db_property_names], "name"
      assert_includes context[:db_property_names], "description"
      assert_includes context[:db_property_names], "compound_id"
    end

    # =========================================================================
    # block_mapping_fields Tests
    # =========================================================================

    test "block_mapping_fields should exclude auto-generated fields" do
      load_set_block = grit_core_load_set_blocks(:batch_loading_validated_block)

      fields = BatchLoader.send(:block_mapping_fields, load_set_block)
      field_names = fields.map { |f| f[:name] }

      # These fields should be excluded
      assert_not_includes field_names, "compound_type_id"
      assert_not_includes field_names, "molweight"
      assert_not_includes field_names, "logp"
      assert_not_includes field_names, "molformula"
      assert_not_includes field_names, "number"

      # These fields should be included
      assert_includes field_names, "name"
      assert_includes field_names, "compound_id"
    end

    # =========================================================================
    # block_loading_fields Tests
    # =========================================================================

    test "block_loading_fields should exclude number field" do
      load_set_block = grit_core_load_set_blocks(:batch_loading_validated_block)

      fields = BatchLoader.send(:block_loading_fields, load_set_block)
      field_names = fields.map { |f| f[:name] }

      # number should be excluded (auto-generated)
      assert_not_includes field_names, "number"

      # compound_type_id and compound_id should be included for loading
      assert_includes field_names, "compound_type_id"
      assert_includes field_names, "compound_id"
      assert_includes field_names, "name"
    end

    # =========================================================================
    # base_record_props Tests
    # =========================================================================

    test "base_record_props should return compound_type_id from load set block" do
      load_set_block = grit_core_load_set_blocks(:batch_loading_validated_block)

      props = BatchLoader.send(:base_record_props, load_set_block)

      assert_not_nil props["compound_type_id"]
      assert_equal @compound_type.id, props["compound_type_id"]
    end

    # =========================================================================
    # Negative Tests
    # =========================================================================

    test "create should raise error with invalid compound_type_id" do
      invalid_params = {
        name: "invalid-batch-load",
        entity: "Grit::Compounds::Batch",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "test-block",
            separator: ",",
            compound_type_id: -999  # Invalid ID
          }
        }
      }

      assert_raises(ActiveRecord::RecordInvalid) do
        BatchLoader.send(:create, invalid_params)
      end
    end

    test "create should raise error with nil compound_type_id" do
      invalid_params = {
        name: "nil-compound-type-batch-load",
        entity: "Grit::Compounds::Batch",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "test-block",
            separator: ",",
            compound_type_id: nil
          }
        }
      }

      assert_raises(ActiveRecord::RecordInvalid) do
        BatchLoader.send(:create, invalid_params)
      end
    end

    test "validate_record should handle missing required fields and add errors" do
      context = {
        batch_properties: [],
        db_property_names: Grit::Compounds::Batch.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        # Missing required fields: compound_id, origin_id
        "compound_type_id" => @compound_type.id
      }

      BatchLoader.send(:validate_record, Grit::Compounds::Batch, record, record_props, context)

      assert_not_nil record[:record_errors], "Should have errors for missing required fields"
      # compound_id is required for batch
      assert record[:record_errors].has_key?(:compound_id), "Should have error for missing compound_id"
    end
  end
end
