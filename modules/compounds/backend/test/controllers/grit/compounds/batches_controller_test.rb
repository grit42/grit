require "test_helper"

module Grit::Compounds
  class BatchesControllerTest < ActionDispatch::IntegrationTest
    include Grit::Compounds::Engine.routes.url_helpers
    include Authlogic::TestCase

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @batch = grit_compounds_batches(:one)
    end

    test "should get index" do
      get grit_compounds.batches_url, as: :json
      assert_response :success
    end

    test "should create batch" do
      @origin = grit_core_origins(:one)
      @compound = grit_compounds_compounds(:one)
      @compound_type = grit_compounds_compound_types(:screening)
      assert_difference("Batch.count") do
        post grit_compounds.batches_url, params: { name: "three", number: "three", origin_id: @origin.id, compound_type_id: @compound_type.id, compound_id: @compound.id }, as: :json
      end

      assert_response :created
    end

    test "should show batch" do
      get grit_compounds.batch_url(@batch), as: :json
      assert_response :success
    end

    test "should update batch" do
      patch grit_compounds.batch_url(@batch), params: { name: "wan" }, as: :json
      assert_response :success
    end

    test "should destroy batch" do
      assert_difference("Batch.count", -1) do
        delete grit_compounds.batch_url(@batch), as: :json
      end

      assert_response :success
    end
  end
end
