# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTablesControllerTest < ActionDispatch::IntegrationTest
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
    end

    # --- Create ---

    test "creates data_table and fires add_entity_type_display_columns callback" do
      assert_difference([ "DataTable.count", "DataTableColumn.count" ]) do
        post grit_assays.data_tables_url, params: {
          name: "Species Table",
          entity_data_type_id: @data_type.id
        }, as: :json
      end

      assert_response :created
      json = JSON.parse(response.body)
      assert json["success"]

      columns = DataTableColumn.where(data_table_id: json["data"]["id"])
      assert_equal 1, columns.count
      assert_equal "entity_name", columns.first.safe_name
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.data_tables_url, as: :json
      assert_response :unauthorized
    end
  end
end
