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
  class RolePermissionsController < ApplicationController
    include Grit::Core::GritEntityController

    before_action :check_system_role, only: [ :update, :destroy ]

    def check_system_role
      role = Grit::Core::RolePermission.find(params[:id]).role
      render json: { success: false, errors: "#{role.name} is a system role and cannot be modified" }, status: :forbidden if role.system?
    end

    def permitted_params
      [ :role_id, :permission_id ]
    end
  end
end
