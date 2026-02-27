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

RSpec.describe Grit::Core::UserRole, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:admin_role) { Grit::Core::Role.find_by!(name: "Administrator") }

  before(:each) do
    Grit::Core::UserSession.create(admin)
  end

  # check_dependencies callback tests
  describe "check_dependencies callback" do
    it "cannot remove Administrator role from admin user" do
      admin_user_role = described_class.find_by!(user: admin, role: admin_role)

      expect {
        admin_user_role.destroy!
      }.to raise_error(RuntimeError, "Not allowed")
    end
  end

  # Association tests
  describe "associations" do
    it "belongs to user" do
      admin_user_role = described_class.find_by!(user: admin, role: admin_role)
      expect(admin_user_role.user).to eq(admin)
    end

    it "belongs to role" do
      admin_user_role = described_class.find_by!(user: admin, role: admin_role)
      expect(admin_user_role.role).to eq(admin_role)
    end
  end
end
