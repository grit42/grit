require "test_helper"

module Grit::Compounds
  class CompoundTypesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Compounds::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @compound_type = grit_compounds_compound_types(:screening)
    end

    test "should get index" do
      get grit_compounds.compound_types_url
      assert_response :success
    end

    test "should create compound_type" do
      assert_difference("CompoundType.count", 1) do
        post grit_compounds.compound_types_url, params: { name: "test type" }, as: :json
      end

      assert_response :created
    end

    test "should show compound_type" do
      get grit_compounds.compound_type_url(@compound_type), as: :json
      assert_response :success
    end

    test "should update compound_type" do
      patch grit_compounds.compound_type_url(@compound_type), params: { name: "Screaning" }, as: :json
      assert_response :success
    end

    test "should destroy compound_type" do
      assert_difference("CompoundType.count", -1) do
        delete grit_compounds.compound_type_url(grit_compounds_compound_types(:reagent)), as: :json
      end

      assert_response :success
    end

    test "should not destroy compound_type with compounds" do
      assert_no_difference("CompoundType.count") do
        delete grit_compounds.compound_type_url(@compound_type), as: :json
      end

      assert_response :internal_server_error
    end
  end
end
