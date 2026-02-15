# frozen_string_literal: true

require "test_helper"

module Grit::Core
  class UserRoleTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      UserSession.create(grit_core_users(:admin))
    end

    # check_dependencies callback tests
    test "cannot remove Administrator role from admin user" do
      admin_role = grit_core_user_roles(:one)  # admin's Administrator role

      assert_raises(RuntimeError, "Not allowed") do
        admin_role.destroy!
      end
    end

    # Association tests
    test "user_role belongs to user" do
      user_role = grit_core_user_roles(:one)
      assert_equal grit_core_users(:admin), user_role.user
    end

    test "user_role belongs to role" do
      user_role = grit_core_user_roles(:one)
      assert_equal grit_core_roles(:one), user_role.role
    end
  end
end
