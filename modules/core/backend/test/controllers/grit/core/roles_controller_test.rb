require "test_helper"

module Grit::Core
  class RolesControllerTest < ActionDispatch::IntegrationTest
    include GritEntityControllerTestHelper

    setup do
      activate_authlogic
      login(grit_core_users(:admin))
      @role = grit_core_roles(:one)
    end

    test "read-only entity behavior" do
      assert_read_only_entity(
        model_class: Role,
        index_url: roles_url,
        show_url: role_url(@role),
        create_params: { name: "Test", description: "Test role" },
        update_url: role_url(@role),
        update_params: { name: "Updated role" },
        destroy_url: role_url(@role)
      )
    end
  end
end
