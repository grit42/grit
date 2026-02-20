# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableRowsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Assays::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      # Pre-populate RequestStore so set_updater doesn't attempt an Authlogic
      # session lookup when creating records directly outside HTTP request context.
      RequestStore.store["current_user"] = grit_core_users(:admin)
      @vocab = Grit::Core::Vocabulary.create!(name: "Test Species")
      @data_type = @vocab.data_type
      @item1 = Grit::Core::VocabularyItem.create!(name: "Mouse", vocabulary: @vocab)
      # Creating the DataTable fires add_entity_type_display_columns, auto-creating
      # a DataTableColumn with safe_name: "entity_name".
      @data_table = DataTable.create!(name: "Test Table", entity_data_type: @data_type)
      DataTableEntity.create!(data_table_id: @data_table.id, entity_id: @item1.id)
    end

    # --- Full Perspective ---

    test "full_perspective returns row data for an entity" do
      get grit_assays.data_table_row_full_perspective_url(@item1.id),
        params: { data_table_id: @data_table.id, column_safe_name: "entity_name" }

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.data_table_row_full_perspective_url(0),
        params: { data_table_id: 0, column_safe_name: "entity_name" }
      assert_response :unauthorized
    end
  end
end
