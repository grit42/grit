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
  class Role < ApplicationRecord
    include Grit::Core::GritEntityRecord


    entity_crud_with read: []

    has_many :user_roles, dependent: :destroy
    has_many :users, through: :user_roles

    def self.access?(params)
      RequestStore.store["Grit::Core::Role.access?#{params[:role_name]}#{Grit::Core::User.current.id}"] ||= find_by(name: params[:role_name]).users.where(id: Grit::Core::User.current.id).count
      count = RequestStore.store["Grit::Core::Role.access?#{params[:role_name]}#{Grit::Core::User.current.id}"]
      count == 1
    end
  end
end
