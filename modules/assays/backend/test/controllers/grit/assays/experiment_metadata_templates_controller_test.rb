require "test_helper"

module Grit::Assays
  class ExperimentMetadataTemplatesControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @experiment_metadata_template = grit_assays_experiment_metadata_templates(:one)
    end

    test "should get index" do
      get experiment_metadata_templates_url, as: :json
      assert_response :success
    end

    test "should create experiment_metadata_template" do
      assert_difference("ExperimentMetadataTemplate.count") do
        post experiment_metadata_templates_url, params: { experiment_metadata_template: {} }, as: :json
      end

      assert_response :created
    end

    test "should show experiment_metadata_template" do
      get experiment_metadata_template_url(@experiment_metadata_template), as: :json
      assert_response :success
    end

    test "should update experiment_metadata_template" do
      patch experiment_metadata_template_url(@experiment_metadata_template), params: { experiment_metadata_template: {} }, as: :json
      assert_response :success
    end

    test "should destroy experiment_metadata_template" do
      assert_difference("ExperimentMetadataTemplate.count", -1) do
        delete experiment_metadata_template_url(@experiment_metadata_template), as: :json
      end

      assert_response :no_content
    end
  end
end
