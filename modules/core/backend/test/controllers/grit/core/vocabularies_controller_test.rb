require "test_helper"

module Grit::Core
  class VocabulariesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @vocabulary = grit_core_vocabularies(:one)
    end

    test "should get index" do
      get vocabularies_url, as: :json
      assert_response :success
    end

    test "should create vocabulary" do
      assert_difference("Vocabulary.count") do
        post vocabularies_url, params: { name: "two" }, as: :json
      end

      assert_response :created
    end

    test "should show vocabulary" do
      get vocabulary_url(@vocabulary), as: :json
      assert_response :success
    end

    test "should update vocabulary" do
      patch vocabulary_url(@vocabulary), params: { name: "wan" }, as: :json
      assert_response :success
    end

    test "should destroy vocabulary" do
      assert_difference("Vocabulary.count", -1) do
        delete vocabulary_url(@vocabulary), as: :json
      end

      assert_response :success
    end
  end
end
