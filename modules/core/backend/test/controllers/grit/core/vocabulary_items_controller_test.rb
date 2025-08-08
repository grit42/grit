require "test_helper"

module Grit::Core
  class VocabularyItemsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @vocabulary_item = grit_core_vocabulary_items(:oneone)
    end

    test "should get index" do
      get vocabulary_items_url, as: :json
      assert_response :success
    end

    test "should create vocabulary_item" do
      @vocabulary = grit_core_vocabularies(:one)
      assert_difference("VocabularyItem.count") do
        post vocabulary_items_url, params: { name: "onethree", vocabulary_id: @vocabulary.id }, as: :json
      end

      assert_response :created
    end

    test "should show vocabulary_item" do
      get vocabulary_item_url(@vocabulary_item), as: :json
      assert_response :success
    end

    test "should update vocabulary_item" do
      patch vocabulary_item_url(@vocabulary_item), params: { name: "wantwo" }, as: :json
      assert_response :success
    end

    test "should destroy vocabulary_item" do
      assert_difference("VocabularyItem.count", -1) do
        delete vocabulary_item_url(@vocabulary_item), as: :json
      end

      assert_response :success
    end
  end
end
