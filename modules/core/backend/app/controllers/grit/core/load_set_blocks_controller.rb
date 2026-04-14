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

require "csv"
require "grit/core/entity_loader"

module Grit::Core
  class LoadSetBlocksController < ApplicationController
    include Grit::Core::GritEntityController

    def fields
      render json: { success: true, data: Grit::Core::EntityLoader.load_set_block_fields(params) }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def mapping_fields
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      render json: { success: true, data: Grit::Core::EntityLoader.load_set_block_mapping_fields(load_set_block) }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def loaded_data_columns
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      render json: { success: true, data: Grit::Core::EntityLoader.load_set_block_loaded_data_columns(load_set_block) }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def entity_info
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      render json: { success: true, data: Grit::Core::EntityLoader.load_set_block_entity_info(load_set_block) }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def preview_data
      params[:scope] = "preview_data"
      index
    end

    def errored_data
      params[:scope] = "errored_data"
      index
    end

    def warning_data
      params[:scope] = "warning_data"
      index
    end

    def export_errored_rows
      raise "No load set block id provided" if params[:load_set_block_id].nil?
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])
      columns = load_set_block.headers
      scope = load_set_block.errored_rows

      Grit::Core::Exporter.scope_to_csv(scope, columns) do |file|
        send_data file.read, filename: "#{load_set_block.name}_errored_rows.csv", content_type: "application/csv"
      end
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def export_errors
      raise "No load set block id provided" if params[:load_set_block_id].nil?
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])
      columns = [ { "name" => "line", "display_name" => "Line" }, { "name" => "column_name", "display_name" => "Column" }, { "name" => "value", "display_name" => "Value" }, { "name" => "error", "display_name" => "Error" } ]
      scope = load_set_block.flattened_errors

      Grit::Core::Exporter.scope_to_csv(scope, columns) do |file|
        send_data file.read, filename: "#{load_set_block.name}_errors.csv", content_type: "application/csv"
      end
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def validate
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      unless [ "Mapping", "Invalidated" ].include?(load_set_block.status.name)
        render json: { success: false, errors: 'Only load set with "Mapping" or "Invalidated" status can be validated' }, status: :forbidden
        return
      end

      load_set_block.mappings = params[:mappings] unless params[:mappings].nil?

      if load_set_block.mappings.nil?
        render json: { success: false, errors: "No mappings provided" }, status: :unprocessable_entity
        return
      end

      load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Validating").id
      load_set_block.has_errors = false
      load_set_block.has_warnings = false

      load_set_block.save!
      Grit::Core::ValidateLoadSetBlockJob.perform_later(load_set_block.id, current_user.id)

      render json: { success: true, data: load_set_block }, status: :accepted

    rescue ActiveRecord::RecordNotFound
      render json: { success: false, errors: "Load set block not found" }, status: :not_found
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def confirm
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      unless [ "Validated", "Invalidated" ].include?(load_set_block.status.name)
        render json: { success: false, errors: 'Only load set with "Validated" or "Invalidated" status can be confirmed' }, status: :forbidden
        return
      end

      load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Confirming").id

      load_set_block.save!
      Grit::Core::ConfirmLoadSetBlockJob.perform_later(load_set_block.id, current_user.id)

      render json: { success: true, data: load_set_block }, status: :accepted

    rescue ActiveRecord::RecordNotFound
      render json: { success: false, errors: "Load set block not found" }, status: :not_found
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def undo_validation
      load_set_block = nil
      ActiveRecord::Base.transaction do
        load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

        load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Mapping").id
        load_set_block.has_errors = false
        load_set_block.has_warnings = false
        load_set_block.save!
        load_set_block.truncate_loading_records_table
      end
      render json: { success: true, data: load_set_block }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def rollback
      load_set_block = nil
      ActiveRecord::Base.transaction do
        load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

        Grit::Core::EntityLoader.rollback_load_set_block(load_set_block)

        load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Created").id
        load_set_block.has_errors = false
        load_set_block.has_warnings = false
        load_set_block.save!
        load_set_block.initialize_data
      end
      render json: { success: true, data: load_set_block }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def validation_progress
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])
      total = load_set_block.raw_data_klass.count(:all)
      validated = load_set_block.loading_record_klass.count(:all)
      render json: { success: true, data: { total: total, validated: validated } }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private
      def permitted_params
        [ "name", "origin_id", "data", "mappings", "separator" ]
      end
  end
end
