# frozen_string_literal: true

require "test_helper"

module Grit::Assays
  class DataTableEntitiesControllerTest < ActionDispatch::IntegrationTest
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
      @item2 = Grit::Core::VocabularyItem.create!(name: "Rat", vocabulary: @vocab)
      @data_table = DataTable.create!(name: "Test Table", entity_data_type: @data_type)
    end

    # --- Create Bulk ---

    test "create_bulk adds multiple entities atomically" do
      assert_difference("DataTableEntity.count", 2) do
        post grit_assays.create_bulk_data_table_entities_url,
          params: [
            { data_table_id: @data_table.id, entity_id: @item1.id },
            { data_table_id: @data_table.id, entity_id: @item2.id }
          ],
          as: :json
      end

      assert_response :success
      json = JSON.parse(response.body)
      assert json["success"]
    end

    # --- Authentication ---

    test "should require authentication" do
      logout
      get grit_assays.data_table_entities_url, as: :json
      assert_response :unauthorized
    end
  end
end
