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
    before_action :check_read, only: %i[ index export ]
    before_action :check_create, only: :create
    before_action :check_destroy, only: :destroy

    def export
      params[:ids] ||= ""
      ids = params[:ids].split(",").map(&:to_i)
      if ids.length == 1
        export_one ids[0]
      else
        export_many ids
      end
    end

    def create
      record = Experiment.find(params[:experiment_id])
      permitted = params.permit(files: [])

      unique_filenames = permitted[:files].map { |f| f.original_filename }.uniq
      if unique_filenames.length != permitted[:files].length
        render json: { success: false, errors: "Cannot upload multiple files with the same name." }, status: :unprocessable_entity
        return
      end

      duplicate_names_in_attached_files = false
      record.attached_files.each do |f|
        next if duplicate_names_in_attached_files
        duplicate_names_in_attached_files = unique_filenames.include? f.filename.to_s
      end

      if duplicate_names_in_attached_files
        render json: { success: false, errors: "Some files have the same name as already attached files." }, status: :unprocessable_entity
        return
      end

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
            next unless ids.blank? || ids.include?(attached_file.id)

            attached_file.open do |file|
              entry_name = "#{record[:name]}_attachments/#{attached_file.filename}"

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

    def check_read
      if Grit::Assays::Experiment.entity_crud[:read].nil? or
        (
          !Grit::Assays::Experiment.entity_crud[:read].length.zero? and
          !Grit::Core::User.current.one_of_these_roles?(Grit::Assays::Experiment.entity_crud[:read])
        )
          render json: {
            success: false,
            errors: "You do not have the permissions required to read Experiment attachments"
          }, status: :forbidden
      end
    end

    def check_create
      if Grit::Assays::Experiment.entity_crud[:create].nil? or
        (
          !Grit::Assays::Experiment.entity_crud[:create].length.zero? and
          !Grit::Core::User.current.one_of_these_roles?(Grit::Assays::Experiment.entity_crud[:create])
        )
          render json: {
            success: false,
            errors: "You do not have the permissions required to create Experiment attachments"
          }, status: :forbidden
      end
    end

    def check_destroy
      if Grit::Assays::Experiment.entity_crud[:destroy].nil? or
        (
          !Grit::Assays::Experiment.entity_crud[:destroy].length.zero? and
          !Grit::Core::User.current.one_of_these_roles?(Grit::Assays::Experiment.entity_crud[:destroy])
        )
          render json: {
            success: false,
            errors: "You do not have the permissions required to delete Experiment attachments"
          }, status: :forbidden
      end
    end
  end
end
