require "test_helper"
require "ostruct"

class Grit::Core::EntityLoaderTest < ActiveSupport::TestCase
  # =========================================================================
  # Loader Dispatch
  # =========================================================================

  test "loader resolves a specialized loader class by entity name" do
    assert_equal TestEntityLoader, Grit::Core::EntityLoader.loader("TestEntity")
  end

  test "loader falls back to EntityLoader when no specialized loader exists" do
    assert_equal Grit::Core::EntityLoader, Grit::Core::EntityLoader.loader("Grit::Core::Origin")
  end

  # =========================================================================
  # fields / block_fields
  # =========================================================================

  test "fields returns entity field with disabled flag" do
    fields = Grit::Core::EntityLoader.send(:fields, {})
    entity_field = fields.find { |f| f[:name] == "entity" }
    assert_not_nil entity_field
    assert entity_field[:disabled]
  end

  test "block_fields excludes data field and marks separator required with placeholder" do
    fields = Grit::Core::EntityLoader.send(:block_fields, {})
    assert_nil fields.find { |f| f[:name] == "data" }, "data field should be excluded"
    separator_field = fields.find { |f| f[:name] == "separator" }
    assert_not_nil separator_field
    assert separator_field[:required]
    assert_not_nil separator_field[:placeholder]
  end

  # =========================================================================
  # validate_record_properties — mapping resolution
  # =========================================================================

  test "validate_record_properties skips property with no mapping entry" do
    properties = [ { name: "name", type: "string" } ]
    lsb = OpenStruct.new(mappings: {})
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, {}, record, record_props, unique_properties)

    assert_not record_props.key?("name"), "record_props should not include unmapped property"
    assert_nil record[:record_errors]
  end

  test "validate_record_properties resolves constant mapping" do
    properties = [ { name: "name", type: "string" } ]
    lsb = OpenStruct.new(mappings: { "name" => { "constant" => true, "value" => "fixed_value" } })
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, {}, record, record_props, unique_properties)

    assert_equal "fixed_value", record_props["name"]
    assert_nil record[:record_errors]
  end

  test "validate_record_properties resolves header mapping from datum" do
    properties = [ { name: "name", type: "string" } ]
    lsb = OpenStruct.new(mappings: { "name" => { "header" => "col_0" } })
    datum = { "col_0" => "hello" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_equal "hello", record_props["name"]
    assert_nil record[:record_errors]
  end

  test "validate_record_properties resolves find_by entity lookup to record id" do
    origin = grit_core_origins(:one)
    properties = [ {
      name: "origin_id",
      type: "integer",
      entity: { full_name: "Grit::Core::Origin", name: "Origin", options: nil }
    } ]
    lsb = OpenStruct.new(mappings: { "origin_id" => { "find_by" => "name", "header" => "col_0" } })
    datum = { "col_0" => origin.name }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_equal origin.id, record_props["origin_id"]
    assert_nil record[:record_errors]
  end

  test "validate_record_properties sets error for unknown entity model" do
    properties = [ {
      name: "thing_id",
      type: "integer",
      entity: { full_name: "Nonexistent::Model", name: "Nonexistent", options: nil }
    } ]
    lsb = OpenStruct.new(mappings: { "thing_id" => { "find_by" => "name", "header" => "col_0" } })
    datum = { "col_0" => "some_value" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_not_nil record[:record_errors]
    assert_includes record[:record_errors]["thing_id"].first, "No such model"
    assert_equal 0, record_props["thing_id"]
  end

  test "validate_record_properties sets error when entity record not found" do
    properties = [ {
      name: "origin_id",
      type: "integer",
      entity: { full_name: "Grit::Core::Origin", name: "Origin", options: nil }
    } ]
    lsb = OpenStruct.new(mappings: { "origin_id" => { "find_by" => "name", "header" => "col_0" } })
    datum = { "col_0" => "does_not_exist" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_not_nil record[:record_errors]
    assert_includes record[:record_errors]["origin_id"].first, "could not find"
    assert_equal 0, record_props["origin_id"]
  end

  # =========================================================================
  # validate_record_properties — type validation
  # =========================================================================

  test "required string with blank value sets can't be blank error" do
    properties = [ { name: "name", type: "string", required: true } ]
    lsb = OpenStruct.new(mappings: { "name" => { "header" => "col_0" } })
    datum = { "col_0" => "" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_not_nil record[:record_errors]
    assert_includes record[:record_errors]["name"], "can't be blank"
  end

  test "required string with present value produces no error" do
    properties = [ { name: "name", type: "string", required: true } ]
    lsb = OpenStruct.new(mappings: { "name" => { "header" => "col_0" } })
    datum = { "col_0" => "hello" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_nil record[:record_errors]
  end

  test "decimal with valid value produces no error" do
    properties = [ { name: "amount", type: "decimal" } ]
    lsb = OpenStruct.new(mappings: { "amount" => { "header" => "col_0" } })
    datum = { "col_0" => "3.14" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_nil record[:record_errors]
    assert_equal "3.14", record_props["amount"]
  end

  test "decimal with invalid string sets is not a number error" do
    properties = [ { name: "amount", type: "decimal" } ]
    lsb = OpenStruct.new(mappings: { "amount" => { "header" => "col_0" } })
    datum = { "col_0" => "not-a-number" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_not_nil record[:record_errors]
    assert_includes record[:record_errors]["amount"], "is not a number"
  end

  test "integer with valid value produces no error" do
    properties = [ { name: "count", type: "integer" } ]
    lsb = OpenStruct.new(mappings: { "count" => { "header" => "col_0" } })
    datum = { "col_0" => "42" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_nil record[:record_errors]
    assert_equal "42", record_props["count"]
  end

  test "integer with non-numeric string sets is not a integer error" do
    properties = [ { name: "count", type: "integer" } ]
    lsb = OpenStruct.new(mappings: { "count" => { "header" => "col_0" } })
    datum = { "col_0" => "abc" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_not_nil record[:record_errors]
    assert_includes record[:record_errors]["count"], "is not a integer"
  end

  test "integer out of range sets is out of range error" do
    properties = [ { name: "count", type: "integer" } ]
    lsb = OpenStruct.new(mappings: { "count" => { "header" => "col_0" } })
    datum = { "col_0" => (2**53).to_s }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_not_nil record[:record_errors]
    assert_includes record[:record_errors]["count"], "is out of range"
  end

  test "datetime with valid ISO string parses to DateTime" do
    properties = [ { name: "occurred_at", type: "datetime" } ]
    lsb = OpenStruct.new(mappings: { "occurred_at" => { "header" => "col_0" } })
    datum = { "col_0" => "2025-01-15T10:30:00Z" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_nil record[:record_errors]
    assert_kind_of DateTime, record_props["occurred_at"]
  end

  test "datetime with invalid string sets Unable to parse datetime error" do
    properties = [ { name: "occurred_at", type: "datetime" } ]
    lsb = OpenStruct.new(mappings: { "occurred_at" => { "header" => "col_0" } })
    datum = { "col_0" => "not-a-date" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_not_nil record[:record_errors]
    assert_includes record[:record_errors]["occurred_at"].first, "Unable to parse datetime"
  end

  test "date with valid string parses to Date" do
    properties = [ { name: "date_field", type: "date" } ]
    lsb = OpenStruct.new(mappings: { "date_field" => { "header" => "col_0" } })
    datum = { "col_0" => "2025-01-15" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_nil record[:record_errors]
    assert_kind_of Date, record_props["date_field"]
  end

  test "date with invalid string sets Unable to parse date error" do
    properties = [ { name: "date_field", type: "date" } ]
    lsb = OpenStruct.new(mappings: { "date_field" => { "header" => "col_0" } })
    datum = { "col_0" => "not-a-date" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_not_nil record[:record_errors]
    assert_includes record[:record_errors]["date_field"].first, "Unable to parse date"
  end

  # =========================================================================
  # validate_record_properties — uniqueness
  # =========================================================================

  test "unique field first occurrence adds no error and tracks value" do
    properties = [ { name: "code", type: "string", unique: true } ]
    lsb = OpenStruct.new(mappings: { "code" => { "header" => "col_0" } })
    datum = { "col_0" => "ABC" }
    record = {}
    record_props = {}
    unique_properties = Hash.new { |h, k| h[k] = Set.new }

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_nil record[:record_errors]
    assert unique_properties["code"].include?("ABC")
  end

  test "unique field duplicate sets should be unique error" do
    properties = [ { name: "code", type: "string", unique: true } ]
    lsb = OpenStruct.new(mappings: { "code" => { "header" => "col_0" } })
    unique_properties = Hash.new { |h, k| h[k] = Set.new }
    unique_properties["code"].add("ABC")

    datum = { "col_0" => "ABC" }
    record = {}
    record_props = {}

    Grit::Core::EntityLoader.send(:validate_record_properties, properties, lsb, datum, record, record_props, unique_properties)

    assert_not_nil record[:record_errors]
    assert_includes record[:record_errors]["code"].first, "should be unique"
  end

  # =========================================================================
  # mapping_fields / block_mapping_fields
  # =========================================================================

  test "mapping_fields returns entity fields for the load set entity" do
    load_set = grit_core_load_sets(:test_entity_mapping)
    fields = Grit::Core::EntityLoader.send(:mapping_fields, load_set)
    assert_kind_of Array, fields
    assert fields.any? { |f| f[:name] == "name" }
  end

  test "block_mapping_fields returns entity fields via the load set block" do
    load_set_block = grit_core_load_set_blocks(:test_entity_mapping_block)
    fields = Grit::Core::EntityLoader.send(:block_mapping_fields, load_set_block)
    assert_kind_of Array, fields
    assert fields.any? { |f| f[:name] == "name" }
  end
end
