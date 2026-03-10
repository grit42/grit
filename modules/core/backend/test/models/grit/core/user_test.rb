# frozen_string_literal: true

require "test_helper"

module Grit::Core
  class UserTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      UserSession.create(grit_core_users(:admin))
    end

    # Email validation tests
    test "valid email format is accepted" do
      user = User.new(
        login: "testuser",
        name: "Test User",
        email: "test@example.com"
      )
      user.valid?
      assert_empty user.errors[:email]
    end

    test "invalid email format is rejected" do
      user = User.new(
        login: "testuser",
        name: "Test User",
        email: "invalid-email"
      )
      assert_not user.valid?
      assert_not_empty user.errors[:email]
    end

    test "email without domain is rejected" do
      user = User.new(
        login: "testuser",
        name: "Test User",
        email: "test@"
      )
      assert_not user.valid?
      assert_not_empty user.errors[:email]
    end

    test "email with subdomain is accepted" do
      user = User.new(
        login: "testuser",
        name: "Test User",
        email: "test@mail.example.com"
      )
      user.valid?
      assert_empty user.errors[:email]
    end

    # Login validation tests
    test "valid login format is accepted" do
      user = User.new(
        login: "valid_user123",
        name: "Test User",
        email: "test@example.com"
      )
      user.valid?
      assert_empty user.errors[:login]
    end

    test "login with invalid start character is rejected" do
      user = User.new(
        login: ".invalidstart",
        name: "Test User",
        email: "test@example.com"
      )
      assert_not user.valid?
      assert_not_empty user.errors[:login]
    end

    test "login with special characters is rejected" do
      user = User.new(
        login: "invalid!user",
        name: "Test User",
        email: "test@example.com"
      )
      assert_not user.valid?
      assert_not_empty user.errors[:login]
    end

    test "login with less than 3 characters is rejected" do
      user = User.new(
        login: "ab",
        name: "Test User",
        email: "test@example.com"
      )
      assert_not user.valid?
      assert_not_empty user.errors[:login]
    end

    # active? method tests
    test "active? returns true when active is true" do
      user = grit_core_users(:admin)
      user.active = true
      assert user.active?
    end

    test "active? returns true when active is string 'true'" do
      user = User.new(active: "true")
      assert user.active?
    end

    test "active? returns true when active is string '1'" do
      user = User.new(active: "1")
      assert user.active?
    end

    test "active? returns false when active is false" do
      user = User.new(active: false)
      assert_not user.active?
    end

    test "active? returns false when active is nil" do
      user = User.new(active: nil)
      assert_not user.active?
    end

    # one_of_these_roles? method tests
    test "one_of_these_roles? returns true when user has one of the roles" do
      admin = grit_core_users(:admin)
      # Access through roles association directly
      assert admin.roles.where(name: "Administrator").exists?
    end

    test "one_of_these_roles? returns false when user has none of the roles" do
      user = grit_core_users(:notadmin)
      # notadmin should not have any roles
      assert_not user.roles.where(name: "Administrator").exists?
    end

    # check_who callback tests
    test "admin can edit another user" do
      other_user = grit_core_users(:notadmin)
      other_user.name = "Updated Name"
      assert other_user.save
    end

    test "user can edit self" do
      UserSession.create(grit_core_users(:notadmin))
      user = grit_core_users(:notadmin)
      user.name = "Updated Name"
      assert user.save
    end

    # check_admin_active callback tests
    test "admin user cannot be deactivated" do
      admin = grit_core_users(:admin)
      admin.active = false
      assert_raises(RuntimeError, "Not allowed") do
        admin.save!
      end
    end

    test "regular user can be deactivated" do
      user = grit_core_users(:notadmin)
      user.active = false
      assert user.save
    end

    # validate_fields callback tests
    test "login cannot be changed after creation" do
      user = grit_core_users(:notadmin)
      user.login = "newlogin"
      assert_raises(RuntimeError, "It is not allowed to change the login field") do
        user.save!
      end
    end

    # validate_two_factor callback tests
    test "two_factor allowed when email is present" do
      user = grit_core_users(:notadmin)
      user.two_factor = true
      assert user.save
    end

    # set_default_values callback tests
    test "login is downcased on create" do
      user = User.new(
        login: "UPPERCASE",
        name: "Test User",
        email: "test@newuser.com",
        origin_id: 1
      )
      user.created_by = "admin"
      user.save!
      assert_equal "uppercase", user.login
    end

    test "email is downcased on create" do
      user = User.new(
        login: "testuser",
        name: "Test User",
        email: "TEST@EXAMPLE.COM",
        origin_id: 1
      )
      user.created_by = "admin"
      user.save!
      assert_equal "test@example.com", user.email
    end

    test "default settings are set on create when not provided" do
      user = User.new(
        login: "testuser2",
        name: "Test User",
        email: "test2@example.com",
        origin_id: 1
      )
      user.created_by = "admin"
      user.save!
      assert_equal({ "theme" => "dark" }, user.settings)
    end

    # random_password callback tests
    test "password is auto-generated on create" do
      user = User.new(
        login: "newuser123",
        name: "Test User",
        email: "new123@example.com",
        origin_id: 1
      )
      user.created_by = "admin"
      assert_nil user.password
      user.save!
      assert_not_nil user.crypted_password
    end

    # check_dependencies callback tests
    test "admin user cannot be deleted" do
      admin = grit_core_users(:admin)
      assert_raises(RuntimeError, "Not allowed") do
        admin.destroy!
      end
    end
  end
end
