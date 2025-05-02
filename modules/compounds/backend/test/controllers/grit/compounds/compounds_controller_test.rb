require "test_helper"

module Grit::Compounds
  class CompoundsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Compounds::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @compound = grit_compounds_compounds(:one)
    end

    test "should get index" do
      get grit_compounds.compounds_url, as: :json
      assert_response :success
    end

    test "should get one result when looking for synonym" do
      get grit_compounds.compounds_url, params: "filter=#{URI.encode_uri_component(ActiveSupport::JSON.encode([ { type: "string", operator: "eq", property: "name", value: "wan" } ]))}"
      assert_response :success
      res = JSON.parse(@response.body)
      assert_equal 1, res["data"].length
      assert_equal "wan", res["data"][0]["name"]
    end

    test "should create compound" do
      @origin = grit_core_origins(:one)
      @compound_type = grit_compounds_compound_types(:screening)
      assert_difference("Compound.count") do
        post grit_compounds.compounds_url, params: { name: "three", number: "three", origin_id: @origin.id, compound_type_id: @compound_type.id }, as: :json
      end

      assert_response :created
    end

    test "should show compound" do
      get grit_compounds.compound_url(@compound), as: :json
      assert_response :success
    end

    test "should update compound" do
      patch grit_compounds.compound_url(@compound), params: { name: "ouane" }, as: :json
      assert_response :success
    end

    test "should destroy compound" do
      assert_difference("Compound.count", -1) do
        delete grit_compounds.compound_url(@compound), as: :json
      end

      assert_response :success
    end
  end
end
