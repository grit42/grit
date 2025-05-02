require "test_helper"

module Grit::Compounds
  class CompoundPropertiesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Compounds::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @compound_property = grit_compounds_compound_properties(:one)
    end

    test "should get index" do
      get grit_compounds.compound_properties_url
      assert_response :success
    end

    test "should create compound_property" do
      @compound_type = grit_compounds_compound_types(:screening)
      @data_type = grit_core_data_types(:integer)
      assert_difference("CompoundProperty.count") do
        post grit_compounds.compound_properties_url, params: { name: "Three", safe_name: "three", compound_type_id: @compound_type.id, data_type_id: @data_type.id, sort: 0, required: false }, as: :json
      end

      assert_response :created
    end

    test "should show compound_property" do
      get grit_compounds.compound_property_url(@compound_property), as: :json
      assert_response :success
    end

    test "should update compound_property" do
      patch grit_compounds.compound_property_url(@compound_property), params: { name: "wan" }, as: :json
      assert_response :success
    end

    test "should not destroy compound_property with value" do
      assert_no_difference("CompoundProperty.count") do
        delete grit_compounds.compound_property_url(@compound_property), as: :json
      end

      assert_response :internal_server_error
    end
  end
end
