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

RSpec.describe Grit::Core::Role, type: :model do
  let(:admin) { create(:grit_core_user, :admin, :with_admin_role) }
  let(:admin_role) { described_class.find_by!(name: "Administrator") }

  before(:each) do
    set_current_user(admin)
  end

  # Associations tests
  describe "associations" do
    it "has many user_roles" do
      expect(admin_role.user_roles.count).to be >= 1
    end

    it "has many users through user_roles" do
      expect(admin_role.users).to include(admin)
    end
  end

  # Basic model tests
  describe "attributes" do
    it "has a name" do
      expect(admin_role.name).to eq("Administrator")
    end

    it "has a description" do
      expect(admin_role.description).not_to be_nil
    end
  end
end
