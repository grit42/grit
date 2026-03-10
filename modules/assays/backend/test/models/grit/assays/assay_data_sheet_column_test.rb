# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class AssayDataSheetColumnTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @draft_column = grit_assays_assay_data_sheet_columns(:draft_results_concentration)
      @published_column = grit_assays_assay_data_sheet_columns(:published_viability)
      @draft_sheet = grit_assays_assay_data_sheet_definitions(:draft_model_results)
    end

    # --- Fixtures ---

    test "fixtures load correctly" do
      assert_not_nil @draft_column
      assert_equal "Concentration", @draft_column.name
      assert_equal "concentration", @draft_column.safe_name
    end

    # --- Associations ---

    test "belongs to assay_data_sheet_definition" do
      assert_equal @draft_sheet, @draft_column.assay_data_sheet_definition
    end

    test "belongs to data_type" do
      assert_equal grit_core_data_types(:integer), @draft_column.data_type
    end

    test "has many data_table_columns" do
      assert_respond_to @draft_column, :data_table_columns
      assert_kind_of ActiveRecord::Associations::CollectionProxy, @draft_column.data_table_columns
    end

    # --- Validations ---

    test "requires name to be unique within data sheet" do
      column = AssayDataSheetColumn.new(
        name: @draft_column.name,
        safe_name: "unique_safe",
        assay_data_sheet_definition: @draft_sheet,
        data_type: grit_core_data_types(:integer),
        sort: 10,
        required: false
      )
      assert_not column.valid?
      assert column.errors[:name].any? { |e| e.include?("has already been taken") }
    end

    test "requires safe_name to be unique within data sheet" do
      column = AssayDataSheetColumn.new(
        name: "Unique Name",
        safe_name: @draft_column.safe_name,
        assay_data_sheet_definition: @draft_sheet,
        data_type: grit_core_data_types(:integer),
        sort: 10,
        required: false
      )
      assert_not column.valid?
      assert column.errors[:safe_name].any? { |e| e.include?("has already been taken") }
    end

    test "safe_name cannot conflict with reserved names" do
      column = AssayDataSheetColumn.new(
        name: "Conflict",
        safe_name: "experiment_id",
        assay_data_sheet_definition: @draft_sheet,
        data_type: grit_core_data_types(:integer),
        sort: 10,
        required: false
      )
      assert_not column.valid?
      assert column.errors[:safe_name].any? { |e| e.include?("cannot be used") }
    end

    test "allows creation with valid attributes on draft model" do
      column = AssayDataSheetColumn.new(
        name: "Valid Column",
        safe_name: "valid_column",
        description: "A valid column",
        assay_data_sheet_definition: @draft_sheet,
        data_type: grit_core_data_types(:integer),
        sort: 10,
        required: false
      )
      assert column.valid?
    end

    # --- Callbacks ---

    test "cannot modify column of published assay model" do
      assert_raises(RuntimeError) do
        @published_column.update!(name: "Cannot Change")
      end
    end

    test "can modify column of draft assay model" do
      @draft_column.name = "Updated Column Name"
      assert @draft_column.save
      assert_equal "Updated Column Name", @draft_column.reload.name
    end

    test "cannot create column on published assay model" do
      published_sheet = grit_assays_assay_data_sheet_definitions(:published_model_results)
      column = AssayDataSheetColumn.new(
        name: "New Column",
        safe_name: "new_column",
        assay_data_sheet_definition: published_sheet,
        data_type: grit_core_data_types(:integer),
        sort: 10,
        required: false
      )
      assert_raises(RuntimeError) do
        column.save!
      end
    end

    # --- detailed scope ---

    test "detailed scope includes assay_model info" do
      result = AssayDataSheetColumn.detailed.find(@draft_column.id)
      assert_respond_to result, :assay_model_id
      assert_respond_to result, :assay_model_id__name
    end

    # --- CRUD Permissions ---

    test "entity_crud_with is configured correctly" do
      crud = AssayDataSheetColumn.entity_crud

      assert_includes crud[:create], "Administrator"
      assert_includes crud[:create], "AssayAdministrator"
      assert_includes crud[:update], "Administrator"
      assert_includes crud[:update], "AssayAdministrator"
      assert_includes crud[:destroy], "Administrator"
      assert_includes crud[:destroy], "AssayAdministrator"
      assert_empty crud[:read]
    end
  end
end
