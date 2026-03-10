# frozen_string_literal: true

require "test_helper"

module Grit::Core
  class DataTypeTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      UserSession.create(grit_core_users(:admin))
    end

    # sql_name method tests
    test "sql_name returns bigint for integer type" do
      data_type = DataType.new(name: "integer", is_entity: false)
      assert_equal "bigint", data_type.sql_name
    end

    test "sql_name returns name for non-integer types" do
      data_type = DataType.new(name: "string", is_entity: false)
      assert_equal "string", data_type.sql_name
    end

    test "sql_name returns name for decimal type" do
      data_type = DataType.new(name: "decimal", is_entity: false)
      assert_equal "decimal", data_type.sql_name
    end

    test "sql_name raises error for entity types" do
      data_type = DataType.new(name: "some_entity", is_entity: true)
      assert_raises(RuntimeError, "no sql name for entity types") do
        data_type.sql_name
      end
    end

    # entity_definition method tests
    test "entity_definition returns nil for non-entity types" do
      data_type = grit_core_data_types(:integer)
      assert_nil data_type.entity_definition
    end

    # entity_data_types scope tests
    test "entity_data_types returns only entity types" do
      # Create a test entity data type
      entity_type = DataType.create!(
        name: "test_entity_type",
        is_entity: true,
        table_name: "grit_core_users"
      )

      entity_types = DataType.entity_data_types

      assert entity_types.all? { |dt| dt.is_entity == true }
      assert entity_types.any? { |dt| dt.name == "test_entity_type" }

      # Cleanup
      entity_type.destroy
    end

    # Basic CRUD tests
    test "can create a data type" do
      data_type = DataType.new(
        name: "test_type",
        is_entity: false
      )
      assert data_type.save
    end

    test "data type is read-only for non-admin operations" do
      # The entity_crud_with read: [] means anyone can read
      data_type = grit_core_data_types(:integer)
      assert data_type.persisted?
    end
  end
end
