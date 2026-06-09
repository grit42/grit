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
  class ExperimentDataSheetRecordsController < ApplicationController
    include Grit::Core::GritEntityController

    def create
      experiment = Grit::Assays::Experiment.find(params[:experiment_id])
      raise "Cannot create records in a published Experiment" if experiment.publication_status.name === "Published"
      @record = Grit::Assays::ExperimentDataSheetRecord.create(params)
      scope = get_scope(params[:scope] || "detailed", params)
      @record = scope.find(@record.id)
      render json: { success: true, data: @record }, status: :created
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def update
      experiment = Grit::Assays::Experiment.find(params[:experiment_id])
      raise "Cannot modify records in a published Experiment" if experiment.publication_status.name === "Published"
      @record = Grit::Assays::ExperimentDataSheetRecord.update(params)
      scope = get_scope(params[:scope] || "detailed", params)
      @record = scope.find(@record.id)
      render json: { success: true, data: @record }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def destroy
      klass = ExperimentDataSheetRecord.sheet_record_klass(params[:assay_data_sheet_definition_id])
      ids = params[:id] if params[:id] != "destroy"
      ids = params[:ids].split(",") if params[:id] == "destroy"

      raise "Cannot delete records in a published Experiment" if klass
        .joins("JOIN grit_assays_experiments gae on gae.id = #{klass.table_name}.experiment_id")
        .joins("JOIN grit_core_publication_statuses gaeps on gaeps.id = gae.publication_status_id AND gaeps.name = 'Published'")
        .where(id: ids).count(:all).positive?

      klass.where(id: ids).destroy_all
      render json: { success: true }
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

    def permitted_params
      %i[ experiment_data_sheet_id ]
    end
  end
end
