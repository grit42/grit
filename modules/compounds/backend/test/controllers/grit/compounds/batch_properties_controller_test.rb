require "test_helper"

module Grit::Compounds
  class BatchPropertiesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Compounds::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:compound_admin))
      @batch_property = grit_compounds_batch_properties(:one)
    end

    test "anyone should get index" do
      login(grit_core_users(:notadmin))
      get grit_compounds.batch_properties_url
      assert_response :success
    end

    test "should create batch_property" do
      @compound_type = grit_compounds_compound_types(:screening)
      @data_type = grit_core_data_types(:integer)
      assert_difference("BatchProperty.count") do
        post grit_compounds.batch_properties_url, params: { name: "Three", safe_name: "three", compound_type_id: @compound_type.id, data_type_id: @data_type.id, sort: 0, required: false }, as: :json
      end

      assert_response :created
    end

    test "should show batch_property" do
      get grit_compounds.batch_property_url(@batch_property), as: :json
      assert_response :success
    end

    test "should update batch_property" do
      patch grit_compounds.batch_property_url(@batch_property), params: { name: "wan" }, as: :json
      assert_response :success
    end

    test "should not destroy batch_property with value" do
      assert_no_difference("BatchProperty.count") do
        delete grit_compounds.batch_property_url(@batch_property), as: :json
      end

      assert_response :internal_server_error
    end
  end
end
