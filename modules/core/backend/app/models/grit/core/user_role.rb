#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit::Core
  class UserRole < ApplicationRecord
    include Grit::Core::GritEntityRecord

    before_create :check_role
    before_update :check_role
    before_destroy :check_dependencies

    self.belongs_to_required_by_default = false
    belongs_to :user
    belongs_to :role

    private

      def check_role
        return if Grit::Core::User.current.role?("Administrator")

        raise "Administrator role required to manage user roles"
      end

      def check_dependencies
        check_role
        return unless user.login == "admin" && role.name == "Administrator"

        raise "Not allowed"
      end
  end
end
