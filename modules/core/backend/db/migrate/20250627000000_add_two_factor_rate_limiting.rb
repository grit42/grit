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

class AddTwoFactorRateLimiting < ActiveRecord::Migration[7.2]
  def up
    add_column :grit_core_users, :two_factor_attempts, :integer, default: 0, null: false
    add_column :grit_core_users, :two_factor_locked_until, :datetime
  end

  def down
    remove_column :grit_core_users, :two_factor_attempts
    remove_column :grit_core_users, :two_factor_locked_until
  end
end
