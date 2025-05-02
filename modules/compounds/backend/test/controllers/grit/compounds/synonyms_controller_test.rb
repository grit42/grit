require "test_helper"

module Grit::Compounds
  class SynonymsControllerTest < ActionDispatch::IntegrationTest
    include Grit::Compounds::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:compound_user))
      @synonym = grit_compounds_synonyms(:wan)
    end

    test "anyone should get index" do
      login(grit_core_users(:notadmin))
      get grit_compounds.synonyms_url, as: :json
      assert_response :success
    end

    test "should create synonym" do
      compound = grit_compounds_compounds(:one)
      assert_difference("Synonym.count") do
        post grit_compounds.synonyms_url, params: { name: "wann", compound_id: compound.id }, as: :json
      end

      assert_response :created
    end

    test "should show synonym" do
      get grit_compounds.synonym_url(@synonym), as: :json
      assert_response :success
    end

    test "should update synonym" do
      patch grit_compounds.synonym_url(@synonym), params: { name: "wann" }, as: :json
      assert_response :success
    end

    test "should destroy synonym" do
      assert_difference("Synonym.count", -1) do
        delete grit_compounds.synonym_url(@synonym), as: :json
      end

      assert_response :success
    end
  end
end
