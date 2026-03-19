# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

RSpec.describe Grit::Core::User, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:notadmin) { create(:grit_core_user) }
  let(:origin) { create(:grit_core_origin) }

  before(:each) do
    set_current_user(admin)
  end

  # Email validation tests
  describe "email validation" do
    it "accepts a valid email format" do
      user = described_class.new(
        login: "testuser",
        name: "Test User",
        email: "test@example.com"
      )
      user.valid?
      expect(user.errors[:email]).to be_empty
    end

    it "rejects an invalid email format" do
      user = described_class.new(
        login: "testuser",
        name: "Test User",
        email: "invalid-email"
      )
      expect(user).not_to be_valid
      expect(user.errors[:email]).not_to be_empty
    end

    it "rejects an email without domain" do
      user = described_class.new(
        login: "testuser",
        name: "Test User",
        email: "test@"
      )
      expect(user).not_to be_valid
      expect(user.errors[:email]).not_to be_empty
    end

    it "accepts an email with subdomain" do
      user = described_class.new(
        login: "testuser",
        name: "Test User",
        email: "test@mail.example.com"
      )
      user.valid?
      expect(user.errors[:email]).to be_empty
    end
  end

  # Login validation tests
  describe "login validation" do
    it "accepts a valid login format" do
      user = described_class.new(
        login: "valid_user123",
        name: "Test User",
        email: "test@example.com"
      )
      user.valid?
      expect(user.errors[:login]).to be_empty
    end

    it "rejects login with invalid start character" do
      user = described_class.new(
        login: ".invalidstart",
        name: "Test User",
        email: "test@example.com"
      )
      expect(user).not_to be_valid
      expect(user.errors[:login]).not_to be_empty
    end

    it "rejects login with special characters" do
      user = described_class.new(
        login: "invalid!user",
        name: "Test User",
        email: "test@example.com"
      )
      expect(user).not_to be_valid
      expect(user.errors[:login]).not_to be_empty
    end

    it "rejects login with less than 3 characters" do
      user = described_class.new(
        login: "ab",
        name: "Test User",
        email: "test@example.com"
      )
      expect(user).not_to be_valid
      expect(user.errors[:login]).not_to be_empty
    end
  end

  # active? method tests
  describe "#active?" do
    it "returns true when active is true" do
      admin.active = true
      expect(admin.active?).to be_truthy
    end

    it "returns true when active is string 'true'" do
      user = described_class.new(active: "true")
      expect(user.active?).to be_truthy
    end

    it "returns true when active is string '1'" do
      user = described_class.new(active: "1")
      expect(user.active?).to be_truthy
    end

    it "returns false when active is false" do
      user = described_class.new(active: false)
      expect(user.active?).to be_falsy
    end

    it "returns false when active is nil" do
      user = described_class.new(active: nil)
      expect(user.active?).to be_falsy
    end
  end

  # one_of_these_roles? method tests
  describe "roles" do
    it "admin has Administrator role" do
      expect(admin.roles.where(name: "Administrator").exists?).to be_truthy
    end

    it "non-admin does not have Administrator role" do
      expect(notadmin.roles.where(name: "Administrator").exists?).to be_falsy
    end
  end

  # check_who callback tests
  describe "check_who callback" do
    it "admin can edit another user" do
      notadmin.name = "Updated Name"
      expect(notadmin.save).to be_truthy
    end

    it "user can edit self" do
      set_current_user(notadmin)
      notadmin.name = "Updated Name"
      expect(notadmin.save).to be_truthy
    end
  end

  # check_admin_active callback tests
  describe "check_admin_active callback" do
    it "admin user cannot be deactivated" do
      admin.active = false
      expect {
        admin.save!
      }.to raise_error(RuntimeError, "Not allowed")
    end

    it "regular user can be deactivated" do
      notadmin.active = false
      expect(notadmin.save).to be_truthy
    end
  end

  # validate_fields callback tests
  describe "validate_fields callback" do
    it "login cannot be changed after creation" do
      notadmin.login = "newlogin"
      expect {
        notadmin.save!
      }.to raise_error(RuntimeError, "It is not allowed to change the login field")
    end
  end

  # validate_two_factor callback tests
  describe "validate_two_factor callback" do
    it "two_factor is allowed when email is present" do
      notadmin.two_factor = true
      expect(notadmin.save).to be_truthy
    end
  end

  # set_default_values callback tests
  describe "set_default_values callback" do
    it "downcases login on create" do
      user = described_class.new(
        login: "UPPERCASE",
        name: "Test User",
        email: "test@newuser.com",
        origin_id: origin.id
      )
      user.created_by = "admin"
      user.save!
      expect(user.login).to eq("uppercase")
    end

    it "downcases email on create" do
      user = described_class.new(
        login: "testuser",
        name: "Test User",
        email: "TEST@EXAMPLE.COM",
        origin_id: origin.id
      )
      user.created_by = "admin"
      user.save!
      expect(user.email).to eq("test@example.com")
    end

    it "sets default settings on create when not provided" do
      user = described_class.new(
        login: "testuser2",
        name: "Test User",
        email: "test2@example.com",
        origin_id: origin.id
      )
      user.created_by = "admin"
      user.save!
      expect(user.settings).to eq({ "theme" => "dark" })
    end
  end

  # random_password callback tests
  describe "random_password callback" do
    it "auto-generates password on create" do
      user = described_class.new(
        login: "newuser123",
        name: "Test User",
        email: "new123@example.com",
        origin_id: origin.id
      )
      user.created_by = "admin"
      expect(user.password).to be_nil
      user.save!
      expect(user.crypted_password).not_to be_nil
    end
  end

  # check_dependencies callback tests
  describe "check_dependencies callback" do
    it "admin user cannot be deleted" do
      expect {
        admin.destroy!
      }.to raise_error(RuntimeError, "Not allowed")
    end
  end
end
