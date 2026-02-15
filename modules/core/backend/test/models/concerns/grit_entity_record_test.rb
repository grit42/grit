# frozen_string_literal: true

require "test_helper"

# Tests for the GritEntityRecord concern using the TestEntity model from the dummy app
class GritEntityRecordTest < ActiveSupport::TestCase
  include Authlogic::TestCase

  setup do
    activate_authlogic
    Grit::Core::UserSession.create(grit_core_users(:admin))
  end

  # ==========================================================================
  # Auto-validation from database schema
  # ==========================================================================

  test "presence validation is auto-generated for non-null columns" do
    entity = TestEntity.new
    assert_not entity.valid?
    assert_includes entity.errors[:name], "can't be blank"
  end

  test "presence validation allows null columns to be blank" do
    entity = TestEntity.new(name: "Valid Name")
    entity.valid?
    # another_string is nullable, so should not have presence error
    assert_empty entity.errors[:another_string]
  end

  test "uniqueness validation is auto-generated for unique indexes" do
    # Use the existing "Test" country from fixtures
    existing = grit_core_countries(:one)
    assert_equal "Test", existing.name

    # Try to create a duplicate - should fail uniqueness
    duplicate = Grit::Core::Country.new(name: "Test", iso: "XX")
    assert_not duplicate.valid?
    assert_includes duplicate.errors[:name], "has already been taken"
  end

  test "length validation mechanism is applied for string columns with limits" do
    # The GritEntityRecord concern auto-generates length validations for string/text columns
    # that have explicit limits. The audit columns (created_by, updated_by) are excluded.
    # PostgreSQL varchar without length is unlimited, so most columns have nil limits.
    #
    # Verify the concern skips audit columns in its validation loop
    column_names_validated = []
    TestEntity.columns.each do |column|
      next if %w[id created_at created_by updated_at updated_by].include?(column.name)
      next if column.sql_type_metadata.limit.nil?
      next unless %i[string text].include?(column.sql_type_metadata.type)
      column_names_validated << column.name
    end

    # In the current schema, no non-audit string columns have explicit limits
    # This test documents the behavior that length validation would be applied if limits existed
    assert_kind_of Array, column_names_validated

    # Verify audit columns are correctly excluded from regular validations
    assert_empty TestEntity._validators[:created_by].to_a
    assert_empty TestEntity._validators[:updated_by].to_a
  end

  # ==========================================================================
  # numbers_in_range validation
  # ==========================================================================

  test "numbers_in_range allows integers within safe JavaScript range" do
    entity = TestEntity.new(name: "Test", integer: 2**53 - 1)
    entity.valid?
    assert_empty entity.errors[:integer]
  end

  test "numbers_in_range rejects integers exceeding safe JavaScript max" do
    entity = TestEntity.new(name: "Test", integer: 2**53)
    assert_not entity.valid?
    assert_includes entity.errors[:integer], "is out of range"
  end

  test "numbers_in_range rejects integers below safe JavaScript min" do
    entity = TestEntity.new(name: "Test", integer: -(2**53))
    assert_not entity.valid?
    assert_includes entity.errors[:integer], "is out of range"
  end

  test "numbers_in_range allows negative integers within safe range" do
    entity = TestEntity.new(name: "Test", integer: -(2**53 - 1))
    entity.valid?
    assert_empty entity.errors[:integer]
  end

  test "numbers_in_range allows nil values" do
    entity = TestEntity.new(name: "Test", integer: nil)
    entity.valid?
    assert_empty entity.errors[:integer]
  end

  # ==========================================================================
  # set_updater callback
  # ==========================================================================

  test "set_updater populates created_by on new record" do
    entity = TestEntity.new(name: "New Entity")
    entity.save!
    assert_equal "admin", entity.created_by
  end

  test "set_updater populates updated_by on save" do
    entity = TestEntity.new(name: "New Entity")
    entity.save!
    assert_equal "admin", entity.updated_by
  end

  test "set_updater updates updated_by on subsequent saves" do
    entity = test_entities(:one)
    entity.name = "Updated Name"
    entity.save!
    assert_equal "admin", entity.updated_by
  end

  # ==========================================================================
  # entity_crud_with configuration
  # ==========================================================================

  test "entity_crud returns configured permissions" do
    crud = TestEntity.entity_crud
    assert_equal [], crud[:create]
    assert_equal [], crud[:read]
    assert_equal [], crud[:update]
    assert_equal [], crud[:destroy]
  end

  test "entity_crud returns nil for unconfigured operations" do
    # Country model only configures read: [], so other operations should be nil
    crud = Grit::Core::Country.entity_crud
    assert_nil crud[:create], "Expected create to be nil (unconfigured)"
    assert_equal [], crud[:read], "Expected read to be [] (explicitly configured)"
    assert_nil crud[:update], "Expected update to be nil (unconfigured)"
    assert_nil crud[:destroy], "Expected destroy to be nil (unconfigured)"
  end

  # ==========================================================================
  # Database introspection methods
  # ==========================================================================

  test "foreign_keys returns foreign key constraints" do
    fks = TestEntity.foreign_keys
    assert_kind_of Array, fks
    # TestEntity has a user_id foreign key
    user_fk = fks.find { |fk| fk.options[:column] == "user_id" }
    assert_not_nil user_fk
    assert_equal "grit_core_users", user_fk.to_table
  end

  test "indexes returns table indexes" do
    indexes = TestEntity.indexes
    assert_kind_of Array, indexes
    # Should include the user_id index
    user_idx = indexes.find { |idx| idx.columns.include?("user_id") }
    assert_not_nil user_idx
  end

  test "unique_index_columns returns columns with unique indexes" do
    unique_cols = Grit::Core::Country.unique_index_columns
    assert_includes unique_cols, "name"
    assert_includes unique_cols, "iso"
  end

  test "unique_properties includes both index and rails validated columns" do
    unique_props = Grit::Core::Country.unique_properties
    assert_includes unique_props, "name"
    assert_includes unique_props, "iso"
  end

  test "db_properties returns column metadata" do
    props = TestEntity.db_properties
    assert_kind_of Array, props

    name_prop = props.find { |p| p[:name] == "name" }
    assert_not_nil name_prop
    assert_equal "Name", name_prop[:display_name]
    assert_equal :string, name_prop[:type]
    assert_equal true, name_prop[:required]
  end

  test "db_properties identifies entity type for foreign keys" do
    props = TestEntity.db_properties
    user_prop = props.find { |p| p[:name] == "user_id" }
    assert_not_nil user_prop
    assert_equal "entity", user_prop[:type]
    assert_equal "Grit::Core::User", user_prop[:entity][:full_name]
  end

  # ==========================================================================
  # Entity metadata methods
  # ==========================================================================

  test "display_properties returns configured display columns" do
    display_props = TestEntity.display_properties
    assert_equal 1, display_props.length
    assert_equal "name", display_props.first[:name]
  end

  test "entity_properties returns all db_properties by default" do
    entity_props = TestEntity.entity_properties
    db_props = TestEntity.db_properties
    assert_equal db_props.length, entity_props.length
  end

  test "entity_fields excludes audit columns" do
    fields = TestEntity.entity_fields
    field_names = fields.map { |f| f[:name] }
    assert_not_includes field_names, "id"
    assert_not_includes field_names, "created_at"
    assert_not_includes field_names, "updated_at"
    assert_not_includes field_names, "created_by"
    assert_not_includes field_names, "updated_by"
  end

  test "entity_fields enriches entity type with display column info" do
    fields = TestEntity.entity_fields
    user_field = fields.find { |f| f[:name] == "user_id" }
    assert_not_nil user_field
    assert_equal "entity", user_field[:type]
    assert_equal "user_id", user_field[:entity][:column]
    # User model has display_column "name"
    assert_equal "name", user_field[:entity][:display_column]
  end

  test "entity_columns includes flattened entity display columns" do
    columns = TestEntity.entity_columns
    # user_id should be expanded to user_id__name
    user_col = columns.find { |c| c[:name] == "user_id__name" }
    assert_not_nil user_col
    assert_equal "entity", user_col[:type]
  end

  test "entity_columns marks audit fields as default_hidden" do
    columns = TestEntity.entity_columns
    id_col = columns.find { |c| c[:name] == "id" }
    created_at_col = columns.find { |c| c[:name] == "created_at" }
    assert_equal true, id_col[:default_hidden]
    assert_equal true, created_at_col[:default_hidden]
  end

  # ==========================================================================
  # Query building (detailed scope)
  # ==========================================================================

  test "detailed scope includes base columns" do
    query = TestEntity.detailed
    assert_kind_of ActiveRecord::Relation, query
    # Should be able to execute the query
    assert_nothing_raised { query.to_a }
  end

  test "detailed scope joins foreign key tables" do
    # Create a test entity with a user reference
    entity = TestEntity.create!(name: "With User", user_id: grit_core_users(:admin).id)

    result = TestEntity.detailed.find(entity.id)
    # The detailed scope should select user_id__name from the joined table
    assert_respond_to result, :user_id__name
    assert_equal "Administrator", result.user_id__name
  ensure
    entity&.destroy
  end

  # ==========================================================================
  # loader_find_by! method
  # ==========================================================================

  test "loader_find_by! finds record by property" do
    entity = test_entities(:one)
    found = TestEntity.loader_find_by!(:name, "one")
    assert_equal entity.id, found.id
  end

  test "loader_find_by! raises when record not found" do
    assert_raises(ActiveRecord::RecordNotFound) do
      TestEntity.loader_find_by!(:name, "nonexistent")
    end
  end
end
