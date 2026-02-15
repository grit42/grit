# frozen_string_literal: true

require "test_helper"

module Grit::Core
  class RoleTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      UserSession.create(grit_core_users(:admin))
    end

    # Associations tests
    test "role has many user_roles" do
      admin_role = grit_core_roles(:one)
      assert admin_role.user_roles.count >= 1
    end

    test "role has many users through user_roles" do
      admin_role = grit_core_roles(:one)
      assert admin_role.users.include?(grit_core_users(:admin))
    end

    # Basic model tests
    test "role has a name" do
      admin_role = grit_core_roles(:one)
      assert_equal "Administrator", admin_role.name
    end

    test "role has a description" do
      admin_role = grit_core_roles(:one)
      assert_not_nil admin_role.description
    end
  end
end
