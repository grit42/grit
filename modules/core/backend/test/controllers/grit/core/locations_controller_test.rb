require "test_helper"

module Grit::Core
  class LocationsControllerTest < ActionDispatch::IntegrationTest
    include GritEntityControllerTestHelper

    setup do
      activate_authlogic
      @location = grit_core_locations(:one)
    end

    test "admin-only CRUD behavior" do
      assert_admin_only_crud(
        model_class: Location,
        admin_user: grit_core_users(:admin),
        non_admin_user: grit_core_users(:notadmin),
        index_url: locations_url,
        show_url: location_url(@location),
        create_params: {
          name: "Test location",
          print_address: "42, somestreet, 4242 Someplace, Somecountry",
          country_id: 42,
          origin_id: 1
        },
        update_url: location_url(@location),
        update_params: { name: "Another name for this test location" },
        destroy_url: location_url(@location)
      )
    end
  end
end
