require "test_helper"

module Grit::Compounds
  class BatchLoaderTest < ActiveSupport::TestCase
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
  end
end
