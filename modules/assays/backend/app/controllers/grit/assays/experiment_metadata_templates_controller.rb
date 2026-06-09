#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-assays.
#
# grit-assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-assays. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit::Assays
  class ExperimentMetadataTemplatesController < ApplicationController
    include Grit::Core::GritEntityController

    def create
      ActiveRecord::Base.transaction do
        record = Grit::Assays::ExperimentMetadataTemplate.new(params.permit(self.permitted_params))
        if !record.save
          render json: { success: false, errors: record.errors }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
          return
        end

        if !record.set_metadata_values(params)
          render json: { success: false, errors: record.errors }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
          return
        end

        scope = get_scope(params[:scope] || "detailed", params)
        @record = scope.find(record.id)
        render json: { success: true, data: record }, status: :created, location: record
      end
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def update
      ActiveRecord::Base.transaction do
        record = Grit::Assays::ExperimentMetadataTemplate.find(params[:id])

        if !record.update(params.permit(self.permitted_params))
          render json: { success: false, errors: record.errors }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
          return
        end

        if !record.set_metadata_values(params)
          render json: { success: false, errors: record.errors }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
          return
        end

        scope = get_scope(params[:scope] || "detailed", params)
        record = scope.find(record.id)
        render json: { success: true, data: record }
      end
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end


    private

    def permitted_params
      %i[ name description ]
    end
  end
end
