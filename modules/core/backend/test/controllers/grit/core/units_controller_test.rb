require "test_helper"

module Grit::Core
  class UnitsControllerTest < ActionDispatch::IntegrationTest
    include GritEntityControllerTestHelper

    setup do
      activate_authlogic
      @unit = grit_core_units(:one)
    end

    test "admin-only CRUD behavior" do
      assert_admin_only_crud(
        model_class: Unit,
        admin_user: grit_core_users(:admin),
        non_admin_user: grit_core_users(:notadmin),
        index_url: units_url,
        show_url: unit_url(@unit),
        create_params: { name: "test_new", abbreviation: "tn" },
        update_url: unit_url(@unit),
        update_params: { name: "meter_updated" },
        destroy_url: unit_url(@unit)
      )
    end
  end
end
