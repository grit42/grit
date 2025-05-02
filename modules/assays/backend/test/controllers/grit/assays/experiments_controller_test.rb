require "test_helper"

module Grit::Assays
  class ExperimentsControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @experiment = grit_assays_experiments(:one)
    end

    test "should get index" do
      get experiments_url, as: :json
      assert_response :success
    end

    test "should create experiment" do
      assert_difference("Experiment.count") do
        post experiments_url, params: { experiment: {} }, as: :json
      end

      assert_response :created
    end

    test "should show experiment" do
      get experiment_url(@experiment), as: :json
      assert_response :success
    end

    test "should update experiment" do
      patch experiment_url(@experiment), params: { experiment: {} }, as: :json
      assert_response :success
    end

    test "should destroy experiment" do
      assert_difference("Experiment.count", -1) do
        delete experiment_url(@experiment), as: :json
      end

      assert_response :no_content
    end
  end
end
