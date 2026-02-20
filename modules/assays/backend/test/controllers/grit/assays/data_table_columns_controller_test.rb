# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableColumnsControllerTest < ActionDispatch::IntegrationTest
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
      # Creating a DataTable fires add_entity_type_display_columns, which auto-creates
      # a DataTableColumn with safe_name: "entity_name" for VocabularyItem's display property.
      @data_table = DataTable.create!(name: "Test Table", entity_data_type: @data_type)
    end

    # --- Create ---

    test "rejects duplicate safe_name within the same data_table" do
      assert_no_difference("DataTableColumn.count") do
        post grit_assays.data_table_columns_url, params: {
          data_table_id: @data_table.id,
          name: "Duplicate Column",
          safe_name: "entity_name",
          source_type: "entity_attribute",
          entity_attribute_name: "name"
        }, as: :json
      end

      assert_response :unprocessable_entity
      json = JSON.parse(response.body)
      assert_not json["success"]
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.data_table_columns_url, as: :json
      assert_response :unauthorized
    end
  end
end
