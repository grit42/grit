# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

# Tests for the GritEntityRecord concern using the TestEntity model from the dummy app
RSpec.describe "GritEntityRecord concern", type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }

  before(:each) do
    Grit::Core::UserSession.create(admin)
  end

  # ==========================================================================
  # Auto-validation from database schema
  # ==========================================================================

  describe "auto-validation from database schema" do
    it "generates presence validation for non-null columns" do
      entity = TestEntity.new
      expect(entity).not_to be_valid
      expect(entity.errors[:name]).to include("can't be blank")
    end

    it "allows null columns to be blank" do
      entity = TestEntity.new(name: "Valid Name")
      entity.valid?
      expect(entity.errors[:another_string]).to be_empty
    end

    it "generates uniqueness validation for unique indexes" do
      existing = create(:grit_core_country, :test)
      duplicate = Grit::Core::Country.new(name: existing.name, iso: "XX")
      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:name]).to include("has already been taken")
    end

    it "applies length validation mechanism for string columns with limits" do
      column_names_validated = []
      TestEntity.columns.each do |column|
        next if %w[id created_at created_by updated_at updated_by].include?(column.name)
        next if column.sql_type_metadata.limit.nil?
        next unless %i[string text].include?(column.sql_type_metadata.type)
        column_names_validated << column.name
      end

      expect(column_names_validated).to be_a(Array)

      expect(TestEntity._validators[:created_by].to_a).to be_empty
      expect(TestEntity._validators[:updated_by].to_a).to be_empty
    end
  end

  # ==========================================================================
  # numbers_in_range validation
  # ==========================================================================

  describe "numbers_in_range validation" do
    it "allows integers within safe JavaScript range" do
      entity = TestEntity.new(name: "Test", integer: 2**53 - 1)
      entity.valid?
      expect(entity.errors[:integer]).to be_empty
    end

    it "rejects integers exceeding safe JavaScript max" do
      entity = TestEntity.new(name: "Test", integer: 2**53)
      expect(entity).not_to be_valid
      expect(entity.errors[:integer]).to include("is out of range")
    end

    it "rejects integers below safe JavaScript min" do
      entity = TestEntity.new(name: "Test", integer: -(2**53))
      expect(entity).not_to be_valid
      expect(entity.errors[:integer]).to include("is out of range")
    end

    it "allows negative integers within safe range" do
      entity = TestEntity.new(name: "Test", integer: -(2**53 - 1))
      entity.valid?
      expect(entity.errors[:integer]).to be_empty
    end

    it "allows nil values" do
      entity = TestEntity.new(name: "Test", integer: nil)
      entity.valid?
      expect(entity.errors[:integer]).to be_empty
    end
  end

  # ==========================================================================
  # set_updater callback
  # ==========================================================================

  describe "set_updater callback" do
    it "populates created_by on new record" do
      entity = TestEntity.new(name: "New Entity")
      entity.save!
      expect(entity.created_by).to eq("admin")
    end

    it "populates updated_by on save" do
      entity = TestEntity.new(name: "New Entity")
      entity.save!
      expect(entity.updated_by).to eq("admin")
    end

    it "updates updated_by on subsequent saves" do
      entity = create(:test_entity)
      entity.name = "Updated Name"
      entity.save!
      expect(entity.updated_by).to eq("admin")
    end
  end

  # ==========================================================================
  # entity_crud_with configuration
  # ==========================================================================

  describe "entity_crud_with configuration" do
    it "returns configured permissions" do
      crud = TestEntity.entity_crud
      expect(crud[:create]).to eq([])
      expect(crud[:read]).to eq([])
      expect(crud[:update]).to eq([])
      expect(crud[:destroy]).to eq([])
    end

    it "returns nil for unconfigured operations" do
      crud = Grit::Core::Country.entity_crud
      expect(crud[:create]).to be_nil
      expect(crud[:read]).to eq([])
      expect(crud[:update]).to be_nil
      expect(crud[:destroy]).to be_nil
    end
  end

  # ==========================================================================
  # Database introspection methods
  # ==========================================================================

  describe "database introspection methods" do
    it "foreign_keys returns foreign key constraints" do
      fks = TestEntity.foreign_keys
      expect(fks).to be_a(Array)
      user_fk = fks.find { |fk| fk.options[:column] == "user_id" }
      expect(user_fk).not_to be_nil
      expect(user_fk.to_table).to eq("grit_core_users")
    end

    it "indexes returns table indexes" do
      indexes = TestEntity.indexes
      expect(indexes).to be_a(Array)
      user_idx = indexes.find { |idx| idx.columns.include?("user_id") }
      expect(user_idx).not_to be_nil
    end

    it "unique_index_columns returns columns with unique indexes" do
      unique_cols = Grit::Core::Country.unique_index_columns
      expect(unique_cols).to include("name")
      expect(unique_cols).to include("iso")
    end

    it "unique_properties includes both index and rails validated columns" do
      unique_props = Grit::Core::Country.unique_properties
      expect(unique_props).to include("name")
      expect(unique_props).to include("iso")
    end

    it "db_properties returns column metadata" do
      props = TestEntity.db_properties
      expect(props).to be_a(Array)

      name_prop = props.find { |p| p[:name] == "name" }
      expect(name_prop).not_to be_nil
      expect(name_prop[:display_name]).to eq("Name")
      expect(name_prop[:type]).to eq(:string)
      expect(name_prop[:required]).to eq(true)
    end

    it "db_properties identifies entity type for foreign keys" do
      props = TestEntity.db_properties
      user_prop = props.find { |p| p[:name] == "user_id" }
      expect(user_prop).not_to be_nil
      expect(user_prop[:type]).to eq("entity")
      expect(user_prop[:entity][:full_name]).to eq("Grit::Core::User")
    end
  end

  # ==========================================================================
  # Entity metadata methods
  # ==========================================================================

  describe "entity metadata methods" do
    it "display_properties returns configured display columns" do
      display_props = TestEntity.display_properties
      expect(display_props.length).to eq(1)
      expect(display_props.first[:name]).to eq("name")
    end

    it "entity_properties returns all db_properties by default" do
      entity_props = TestEntity.entity_properties
      db_props = TestEntity.db_properties
      expect(entity_props.length).to eq(db_props.length)
    end

    it "entity_fields excludes audit columns" do
      fields = TestEntity.entity_fields
      field_names = fields.map { |f| f[:name] }
      expect(field_names).not_to include("id")
      expect(field_names).not_to include("created_at")
      expect(field_names).not_to include("updated_at")
      expect(field_names).not_to include("created_by")
      expect(field_names).not_to include("updated_by")
    end

    it "entity_fields enriches entity type with display column info" do
      fields = TestEntity.entity_fields
      user_field = fields.find { |f| f[:name] == "user_id" }
      expect(user_field).not_to be_nil
      expect(user_field[:type]).to eq("entity")
      expect(user_field[:entity][:column]).to eq("user_id")
      expect(user_field[:entity][:display_column]).to eq("name")
    end

    it "entity_columns includes flattened entity display columns" do
      columns = TestEntity.entity_columns
      user_col = columns.find { |c| c[:name] == "user_id__name" }
      expect(user_col).not_to be_nil
      expect(user_col[:type]).to eq("entity")
    end

    it "entity_columns marks audit fields as default_hidden" do
      columns = TestEntity.entity_columns
      id_col = columns.find { |c| c[:name] == "id" }
      created_at_col = columns.find { |c| c[:name] == "created_at" }
      expect(id_col[:default_hidden]).to eq(true)
      expect(created_at_col[:default_hidden]).to eq(true)
    end
  end

  # ==========================================================================
  # Query building (detailed scope)
  # ==========================================================================

  describe "detailed scope" do
    it "includes base columns" do
      query = TestEntity.detailed
      expect(query).to be_a(ActiveRecord::Relation)
      expect { query.to_a }.not_to raise_error
    end

    it "joins foreign key tables" do
      entity = TestEntity.create!(name: "With User", user_id: admin.id)

      result = TestEntity.detailed.find(entity.id)
      expect(result).to respond_to(:user_id__name)
      expect(result.user_id__name).to eq("Administrator")
    ensure
      entity&.destroy
    end
  end

  # ==========================================================================
  # loader_find_by! method
  # ==========================================================================

  describe ".loader_find_by!" do
    it "finds record by property" do
      entity = create(:test_entity, name: "findable")
      found = TestEntity.loader_find_by!(:name, "findable")
      expect(found.id).to eq(entity.id)
    end

    it "raises when record not found" do
      expect {
        TestEntity.loader_find_by!(:name, "nonexistent")
      }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
