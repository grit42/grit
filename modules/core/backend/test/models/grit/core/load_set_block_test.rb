# frozen_string_literal: true

require "test_helper"

module Grit::Core
  class LoadSetBlockTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      UserSession.create(grit_core_users(:admin))
    end

    # separator_set validation tests
    test "tab separator is valid" do
      load_set_block = LoadSetBlock.new(
        name: "test-block",
        load_set: grit_core_load_sets(:test_entity_mapping),
        status: grit_core_load_set_statuses(:mapping),
        separator: "\t",
        headers: [],
        mappings: {}
      )
      load_set_block.valid?
      assert_empty load_set_block.errors[:separator]
    end

    test "comma separator is valid" do
      load_set_block = LoadSetBlock.new(
        name: "test-block",
        load_set: grit_core_load_sets(:test_entity_mapping),
        status: grit_core_load_set_statuses(:mapping),
        separator: ",",
        headers: [],
        mappings: {}
      )
      load_set_block.valid?
      assert_empty load_set_block.errors[:separator]
    end

    test "blank separator is rejected" do
      load_set_block = LoadSetBlock.new(
        name: "test-block",
        load_set: grit_core_load_sets(:test_entity_mapping),
        status: grit_core_load_set_statuses(:mapping),
        separator: "",
        headers: [],
        mappings: {}
      )
      assert_not load_set_block.valid?
      assert_includes load_set_block.errors[:separator], "cannot be blank"
    end

    test "nil separator is rejected" do
      load_set_block = LoadSetBlock.new(
        name: "test-block",
        load_set: grit_core_load_sets(:test_entity_mapping),
        status: grit_core_load_set_statuses(:mapping),
        separator: nil,
        headers: [],
        mappings: {}
      )
      assert_not load_set_block.valid?
      assert_includes load_set_block.errors[:separator], "cannot be blank"
    end

    # check_status callback tests
    test "cannot delete load set block with succeeded status" do
      succeeded_block = grit_core_load_set_blocks(:test_entity_succeeded_block)
      assert_equal "Succeeded", succeeded_block.status.name

      result = succeeded_block.destroy
      assert_not result
      assert LoadSetBlock.exists?(succeeded_block.id)
    end

    test "can delete load set block with mapping status" do
      mapping_block = grit_core_load_set_blocks(:test_entity_mapping_block)
      assert_equal "Mapping", mapping_block.status.name

      assert mapping_block.destroy
      assert_not LoadSetBlock.exists?(mapping_block.id)
    end

    test "can delete load set block with errored status" do
      load_set = grit_core_load_sets(:test_entity_mapping)
      errored_block = LoadSetBlock.create!(
        name: "errored-block",
        load_set: load_set,
        status: grit_core_load_set_statuses(:errored),
        separator: ",",
        headers: [],
        mappings: {}
      )

      assert errored_block.destroy
      assert_not LoadSetBlock.exists?(errored_block.id)
    end

    # Table name methods
    test "loading_records_table_name returns correct format" do
      block = grit_core_load_set_blocks(:test_entity_mapping_block)
      assert_equal "lsb_#{block.id}", block.loading_records_table_name
    end

    test "raw_data_table_name returns correct format" do
      block = grit_core_load_set_blocks(:test_entity_mapping_block)
      assert_equal "raw_lsb_#{block.id}", block.raw_data_table_name
    end

    # entity_fields tests
    test "entity_fields returns name and separator fields" do
      fields = LoadSetBlock.entity_fields
      field_names = fields.map { |f| f[:name] }

      assert_includes field_names, "name"
      assert_includes field_names, "separator"
    end

    test "separator field has select options" do
      fields = LoadSetBlock.entity_fields
      separator_field = fields.find { |f| f[:name] == "separator" }

      assert_equal "select", separator_field[:type]
      assert separator_field[:select][:options].is_a?(Array)
      assert separator_field[:select][:options].length > 0

      # Check that common separators are included
      values = separator_field[:select][:options].map { |o| o[:value] }
      assert_includes values, ","
      assert_includes values, "\t"
      assert_includes values, ";"
    end
  end
end
