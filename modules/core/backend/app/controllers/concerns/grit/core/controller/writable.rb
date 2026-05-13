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

require "grit/core/filter_provider"

module Grit::Core::Controller::Writable
  extend ActiveSupport::Concern
  include Grit::Core::Controller::Authenticated

  included do
    before_action :check_write, only: %i[ create update destroy ] if self.include? Grit::Core::Controller::Authorized

    def create
      klass = controller_path.classify.constantize
      permitted_params = params.permit(self.permitted_params)
      @record = klass.new(permitted_params)

      if @record.save
        render json: { success: true, data: @record }, status: :created, location: @record
      else
        render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
      end
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def update
      klass = controller_path.classify.constantize
      @record = klass.find(params[:id])
      permitted_params = params.permit(self.permitted_params)

      if @record.update(permitted_params)
        scope = get_scope(params[:scope] || "detailed", params)
        @record = scope.find(params[:id])
        render json: { success: true, data: @record }
      else
        render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
      end
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def destroy
      klass = controller_path.classify.constantize
      ids = params[:id] if params[:id] != "destroy"
      ids = params[:ids].split(",") if params[:id] == "destroy"
      Rails.logger.info klass.where(id: ids)
      klass.where(id: ids).destroy_all
      render json: { success: true }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

    def get_scope(scope, params)
      klass = controller_path.classify.constantize
      klass_scope = klass.send(scope, params) if klass.respond_to?(scope)
      render json: { success: false, errors: "#{controller_path.classify} does not implement scope '#{scope}'" }, status: :bad_request if klass_scope.nil?
      klass_scope
    end
  end
end
