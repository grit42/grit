require "test_helper"

module Grit::Assays
  class ExperimentMetadataTemplateMetadataControllerTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    setup do
      @experiment_metadata_template_metadatum = grit_assays_experiment_metadata_template_metadata(:one)
    end

    test "should get index" do
      get experiment_metadata_template_metadata_url, as: :json
      assert_response :success
    end

    test "should create experiment_metadata_template_metadatum" do
      assert_difference("ExperimentMetadataTemplateMetadatum.count") do
        post experiment_metadata_template_metadata_url, params: { experiment_metadata_template_metadatum: {} }, as: :json
      end

      assert_response :created
    end

    test "should show experiment_metadata_template_metadatum" do
      get experiment_metadata_template_metadatum_url(@experiment_metadata_template_metadatum), as: :json
      assert_response :success
    end

    test "should update experiment_metadata_template_metadatum" do
      patch experiment_metadata_template_metadatum_url(@experiment_metadata_template_metadatum), params: { experiment_metadata_template_metadatum: {} }, as: :json
      assert_response :success
    end

    test "should destroy experiment_metadata_template_metadatum" do
      assert_difference("ExperimentMetadataTemplateMetadatum.count", -1) do
        delete experiment_metadata_template_metadatum_url(@experiment_metadata_template_metadatum), as: :json
      end

      assert_response :no_content
    end
  end
end
