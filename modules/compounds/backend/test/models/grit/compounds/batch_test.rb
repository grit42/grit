require "test_helper"

module Grit::Compounds
  class BatchTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @batch = grit_compounds_batches(:one)
      @compound = grit_compounds_compounds(:one)
      @compound_type = grit_compounds_compound_types(:screening)
      @origin = grit_core_origins(:one)
    end

    # Existing entity properties tests
    test "entity properties should include dynamic properties" do
      assert_not false do
        property_names = Grit::Compounds::Batch.entity_properties.map { |p| p[:name] }
        [ "name", "number", "origin_id", "compound_type_id", "compound_id", "one", "two" ].all? { |p| property_names.include?(p) }
      end
    end

    test "entity properties should include only dynamic properties of the specified type" do
      assert_not false do
        property_names = Grit::Compounds::Batch.entity_properties(compound_type_id: grit_compounds_compound_types(:reagent).id).map { |p| p[:name] }
        [ "one", "two" ].all? { |p| property_names.include?(p) }
      end
    end

    # Test associations
    test "batch should belong to compound" do
      assert_equal @compound, @batch.compound
    end

    test "batch should belong to compound_type" do
      assert_equal @compound_type, @batch.compound_type
    end

    test "batch should belong to origin" do
      assert_equal @origin.id, @batch.origin_id
    end

    test "batch should have many batch_property_values" do
      assert @batch.respond_to?(:batch_property_values)
    end

    # Test set_number callback
    test "set_number should auto-generate BATCH prefixed number on create" do
      new_batch = Batch.new(
        name: "test_batch",
        origin_id: @origin.id,
        compound_type_id: @compound_type.id,
        compound_id: @compound.id
      )
      new_batch.save!

      assert_not_nil new_batch.number
      assert new_batch.number.start_with?("BATCH"), "Number should start with BATCH prefix"
      assert_match(/^BATCH\d{7}$/, new_batch.number, "Number should match BATCH followed by 7 digits")
    end

    # Test Batch.create class method
    test "Batch.create should create batch with basic properties" do
      result = Batch.create({
        "name" => "new_batch",
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id,
        "compound_id" => @compound.id
      })

      assert_not_nil result[:batch_id]

      created_batch = Batch.find(result[:batch_id])
      assert_equal "new_batch", created_batch.name
      assert_equal @compound.id, created_batch.compound_id
    end

    # Test detailed scope
    test "detailed scope should include compound data" do
      result = Batch.detailed.where(id: @batch.id).first

      assert_not_nil result
      assert result.respond_to?(:compound_id__number)
      assert result.respond_to?(:compound_id__name)
      assert result.respond_to?(:origin_id__name)
      assert result.respond_to?(:compound_type_id__name)
    end

    # Test entity_fields and entity_columns
    test "entity_fields should generate fields from properties" do
      fields = Batch.entity_fields
      assert fields.is_a?(Array)
      assert fields.any? { |f| f[:name] == "name" }
      assert fields.any? { |f| f[:name] == "compound_id" }
    end

    test "entity_columns should generate columns from properties" do
      columns = Batch.entity_columns
      assert columns.is_a?(Array)
      assert columns.any? { |c| c[:name] == "name" }
      # compound_id is displayed as joined columns
      assert columns.any? { |c| c[:name] == "compound_id__number" || c[:name] == "compound_id__name" }
    end

    # Test compound_type_properties
    test "compound_type_properties should return type-specific properties" do
      properties = Batch.compound_type_properties(compound_type_id: @compound_type.id)
      assert properties.is_a?(Array)
      # Each property should have required keys
      if properties.any?
        first_prop = properties.first
        assert first_prop.key?(:name)
        assert first_prop.key?(:display_name)
        assert first_prop.key?(:type)
      end
    end

    test "compound_type_properties should return all properties when no type specified" do
      all_properties = Batch.compound_type_properties
      specific_properties = Batch.compound_type_properties(compound_type_id: @compound_type.id)

      # All properties should include properties from all types
      assert all_properties.length >= specific_properties.length
    end
  end
end
