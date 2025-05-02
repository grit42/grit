require "test_helper"

class TestEntitiesControllerTest < ActionDispatch::IntegrationTest
  setup do
    @test_entity = test_entities(:one)
  end

  test "should get index" do
    get test_entities_url, as: :json
    assert_response :success
  end

  test "should create test_entity" do
    assert_difference("TestEntity.count") do
      post test_entities_url, params: { test_entity: {} }, as: :json
    end

    assert_response :created
  end

  test "should show test_entity" do
    get test_entity_url(@test_entity), as: :json
    assert_response :success
  end

  test "should update test_entity" do
    patch test_entity_url(@test_entity), params: { test_entity: {} }, as: :json
    assert_response :success
  end

  test "should destroy test_entity" do
    assert_difference("TestEntity.count", -1) do
      delete test_entity_url(@test_entity), as: :json
    end

    assert_response :no_content
  end
end
