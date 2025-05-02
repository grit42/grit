require "test_helper"

module Grit::Assays
  class VocabularyItemsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @vocabulary_item = grit_assays_vocabulary_items(:one)
    end

    test "should get index" do
      get vocabulary_items_url, as: :json
      assert_response :success
    end

    test "should create vocabulary_item" do
      assert_difference("VocabularyItem.count") do
        post vocabulary_items_url, params: { vocabulary_item: {} }, as: :json
      end

      assert_response :created
    end

    test "should show vocabulary_item" do
      get vocabulary_item_url(@vocabulary_item), as: :json
      assert_response :success
    end

    test "should update vocabulary_item" do
      patch vocabulary_item_url(@vocabulary_item), params: { vocabulary_item: {} }, as: :json
      assert_response :success
    end

    test "should destroy vocabulary_item" do
      assert_difference("VocabularyItem.count", -1) do
        delete vocabulary_item_url(@vocabulary_item), as: :json
      end

      assert_response :no_content
    end
  end
end
