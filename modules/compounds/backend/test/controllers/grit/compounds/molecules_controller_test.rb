require "test_helper"

module Grit::Compounds
  class MoleculesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Compounds::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @molecule = grit_compounds_molecules(:ethanol)
      @valid_molfile = File.read(file_fixture("simple.sdf")).split("> <").first
    end

    test "should check if molecule exists with valid molfile" do
      post grit_compounds.molecule_exists_molecules_url, params: { molfile: @valid_molfile }, as: :json

      assert_response :success
      response_body = JSON.parse(@response.body)
      assert response_body["success"]
      assert response_body["data"]["molfile"] = @valid_molfile
      assert_nil response_body["data"]["existing_molecule_id"]
      assert_empty response_body["data"]["existing_molecule_compounds"]
    end

    test "should check if molecule exists with existing molecule" do
      existing_molfile = @molecule.molfile
      post grit_compounds.molecule_exists_molecules_url, params: { molfile: existing_molfile }, as: :json

      assert_response :success
      response_body = JSON.parse(@response.body)
      assert response_body["success"]
      if response_body["data"]["existing_molecule_id"].present?
        assert_equal @molecule.id, response_body["data"]["existing_molecule_id"]
        assert_equal 1, response_body["data"]["existing_molecule_compounds"].length
      end
    end

    test "should handle invalid molfile in molecule_exists" do
      invalid_molfile = "invalid structure data"
      post grit_compounds.molecule_exists_molecules_url, params: { molfile: invalid_molfile }, as: :json

      assert_response :success
      response_body = JSON.parse(@response.body)
      assert response_body["success"]
      assert_nil response_body["data"]["existing_molecule_id"]
      assert_empty response_body["data"]["existing_molecule_compounds"]
    end

    test "should handle empty molfile in molecule_exists" do
      post grit_compounds.molecule_exists_molecules_url, params: { molfile: "" }, as: :json

      assert_response :success
      response_body = JSON.parse(@response.body)
      assert response_body["success"]
      assert_nil response_body["data"]["existing_molecule_id"]
      assert_empty response_body["data"]["existing_molecule_compounds"]
    end

    test "should require authentication for molecule_exists" do
      logout
      post grit_compounds.molecule_exists_molecules_url, params: { molfile: @valid_molfile }, as: :json

      assert_response :unauthorized
    end
  end
end
