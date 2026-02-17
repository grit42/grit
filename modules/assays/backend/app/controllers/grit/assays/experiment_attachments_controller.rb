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
  class ExperimentAttachmentsController < ApplicationController
    def export
      ids = params[:ids].split(",")
      if ids.length == 1
        export_one ids[0].to_i
      elsif ids.length > 1
        export_many ids.map(&:to_i)
      end
      render plain: "No files to download", status: :not_found unless performed?
    end

    def create
      record = Experiment.find(params[:experiment_id])
      permitted = params.permit(files: [])
      record.attached_files.attach(permitted[:files])
      render json: { success: true }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def destroy
      record = Experiment.find(params[:experiment_id])
      ids = []
      ids = params[:id] if params[:id] != "destroy"
      if params[:id] == "destroy"
        ids = params[:ids].split(",") if params[:ids].is_a? String
        ids = params[:ids] if params[:ids].is_a? Array
      end
      record.attached_files.each do |f|
        if ids.include? f.id
          f.purge
        end
      end
      render json: { success: true }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def index
      record = Experiment.find(params[:experiment_id])
      files_info = record.attached_files.map { |f| { filename: f.filename, id: f.id, blob_id: f.blob_id } }
      render json: { success: true, data: files_info }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

    def permitted_params
      [ files: [] ]
    end

    def export_one(id)
      record = Grit::Assays::Experiment.find(params[:experiment_id])
      attached_file = record.attached_files.find(id)

      send_data attached_file.download,
                filename: attached_file.filename.to_s,
                type: attached_file.content_type,
                disposition: "attachment"
    rescue ActiveRecord::RecordNotFound => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render plain: "No files to download", status: :not_found
    end

    def export_many(ids)
      record = Grit::Assays::Experiment.find(params[:experiment_id])
      archive_filename = "#{record[:name]}_attachments.zip"

      temp_file = Tempfile.new([archive_filename, ".zip"])

      begin
        Zip::OutputStream.open(temp_file.path) do |zos|
          record.attached_files.each do |attached_file|
            next unless ids.include?(attached_file.id)

            attached_file.open do |file|
              entry_name = "#{record[:name]}_attachments/#{attached_file.name}"

              zos.put_next_entry(entry_name)

              IO.copy_stream(file, zos)
            end
          end
        end

        temp_file.rewind

        send_file temp_file.path,
                  filename: archive_filename,
                  type: "application/zip",
                  disposition: "attachment"
      end
    end
  end
end
