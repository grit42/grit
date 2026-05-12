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
  class RolesController < ApplicationController
    include Grit::Core::GritEntityController

    before_action :check_system_role, only: [ :update, :destroy ]

    def set_permissions
      if params[:permissions].nil?
        render json: { success: false, errors: "Must provide 'permissions'" }, status: :bad_request
        return
      end
      role = Grit::Core::Role.find(params[:id])
      role_permissions = params[:permissions].map { |p| { permission_id: p, role_id: role.id } }
      Grit::Core::Role.transaction do
        role.role_permissions.insert_all(role_permissions) if role_permissions.present?
        role_permissions_to_destroy = role.role_permissions
        role_permissions_to_destroy = role_permissions_to_destroy.where("permission_id NOT IN (?)", params[:permissions]) unless params[:permissions].blank?
        role_permissions_to_destroy.destroy_all
      end
      render json: { success: true }
    rescue ActiveRecord::RecordNotFound
      render json: { success: false, errors: "Role not found" }, status: :not_found
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def permitted_params
      [ :name, :description ]
    end

    private

    def check_system_role
      id = params[:id]
      id ||= params[:id]
      role = Grit::Core::Role.find(id)
      render json: { success: false, errors: "#{role.name} is a system role and cannot be modified" }, status: :forbidden if role.system?
    end
  end
end
