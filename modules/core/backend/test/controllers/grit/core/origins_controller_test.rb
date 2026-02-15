require "test_helper"

module Grit::Core
  class OriginsControllerTest < ActionDispatch::IntegrationTest
    include GritEntityControllerTestHelper

    setup do
      activate_authlogic
      @origin = grit_core_origins(:two)
    end

    test "admin-only CRUD behavior" do
      assert_admin_only_crud(
        model_class: Origin,
        admin_user: grit_core_users(:admin),
        non_admin_user: grit_core_users(:notadmin),
        index_url: origins_url,
        show_url: origin_url(@origin),
        create_params: { name: "TESTTEST", domain: "Testtest domain", status: "Testtest status" },
        update_url: origin_url(@origin),
        update_params: { name: "TESTTESTTEST" },
        destroy_url: origin_url(@origin)
      )
    end
  end
end
