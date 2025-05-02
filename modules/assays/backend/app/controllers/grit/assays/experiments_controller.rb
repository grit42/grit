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

require "zip"
require "csv"

module Grit::Assays
  class ExperimentsController < ApplicationController
    include Grit::Core::GritEntityController

    def create
      @record = Grit::Assays::Experiment.create(params.permit(self.permitted_params))
      if @record.new_record?
        render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
        return
      end
      scope = get_scope(params[:scope] || "detailed", params)
      @record = scope.find(@record.id)
      render json: { success: true, data: @record }, status: :created, location: @record
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def show
      experiment = show_entity(params)
      experiment = {
        **experiment.as_json,
        data_sheets: Grit::Assays::ExperimentDataSheet.detailed.where(experiment_id: experiment.id).order(sort: :asc).find_all
      }

      render json: { success: true, data: experiment }
    end

    def export
      experiment = Grit::Assays::Experiment.find(params[:experiment_id])
      archive_filename = "#{experiment[:name]}.zip"
      temp_file = Tempfile.new(archive_filename)
      begin
        do_export(experiment, temp_file)
        send_data File.open(temp_file.path).read, filename: archive_filename, type: "application/zip"
      ensure
        temp_file.close
        temp_file.unlink
      end
    end

    private

    def permitted_params
      [ :name, :description, :assay_id, :publication_status_id, plots: {} ]
    end

    def do_export(experiment, temp_file)
      Zip::OutputStream.open(temp_file) { |zos| }
      Zip::File.open(temp_file.path, Zip::File::CREATE) do |zipfile|
        experiment.experiment_data_sheets.each do |data_sheet|
          data_sheet_for_experiment(zipfile, experiment, data_sheet)
        end
      end
      temp_file
    end

    def data_sheet_for_experiment(zipfile, experiment, data_sheet)
      columns = Grit::Assays::ExperimentDataSheetRecord.entity_columns(data_sheet_id: data_sheet[:id]).reject { |c| c[:default_hidden] }

      data_sheet_filename = "#{experiment[:name]}_#{data_sheet.assay_data_sheet_definition[:name]}.csv"
      temp_file = Tempfile.new(data_sheet_filename)
      record_columns = columns.map do |column|
        "\"sub\".\"#{column[:name]}\" as \"#{column[:display_name]}\""
      end

      begin
        data_sheet_sql = Grit::Assays::ExperimentDataSheetRecord.detailed(experiment_data_sheet_id: data_sheet[:id]).to_sql
        data_sheet_copy_sql = "COPY (SELECT #{record_columns.join(',')} from (#{data_sheet_sql}) sub) TO STDOUT WITH DELIMITER ',' CSV HEADER"

        ActiveRecord::Base.connection.raw_connection.copy_data(data_sheet_copy_sql) do
          while (row = ActiveRecord::Base.connection.raw_connection.get_copy_data)
            temp_file.write(row.force_encoding("UTF-8"))
          end
        end

        temp_file.rewind
        zipfile.add("#{experiment[:name]}/#{data_sheet.assay_data_sheet_definition[:name]}.csv", temp_file.path)
        zipfile.commit
      ensure
        temp_file.close
        temp_file.unlink
      end
    end
  end
end
