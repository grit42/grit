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

    def create
      ActiveRecord::Base.transaction do
        begin
          record = Grit::Core::EntityLoader.create_load_set(params)
          render json: { success: true, data: record }, status: :created, location: record
          return
        rescue EntityLoader::MaxFileSizeExceededError => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: { data: [ e.to_s ] } }, status: :unprocessable_entity
        rescue EntityLoader::ParseException => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: { data: [ e.to_s ] } }, status: :unprocessable_entity
        rescue ActiveRecord::RecordInvalid => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: e.record.errors }, status: :unprocessable_entity
        rescue ActiveRecord::RecordNotSaved => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: e.to_s }, status: :unprocessable_entity
        end
        raise ActiveRecord::Rollback
      end
    end

    def show
      id = params[:id]
      load_set = Grit::Core::LoadSet.detailed.find(id)
      record = Grit::Core::EntityLoader.show_load_set(load_set)
      render json: { success: true, data: record }
    rescue ActiveRecord::RecordNotFound
      render json: { success: false, errors: "Load set not found" }, status: :not_found
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def destroy
      id = params[:ids]

      load_set = Grit::Core::LoadSet.find(id)

      if load_set.status.name == "Succeeded"
        render json: { success: false, errors: "Cannot delete succeeded load set, it must be undone first." }, status: :forbidden
        return
      end

      Grit::Core::EntityLoader.destroy_load_set(load_set)

      render json: { success: true }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def fields
      render json: { success: true, data: Grit::Core::EntityLoader.load_set_block_fields(params) }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def data_set_fields
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      render json: { success: true, data: Grit::Core::EntityLoader.load_set_block_set_data_fields(load_set_block) }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def mapping_fields
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      render json: { success: true, data: Grit::Core::EntityLoader.load_set_block_mapping_fields(load_set_block) }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def loaded_data_columns
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      render json: { success: true, data: Grit::Core::EntityLoader.load_set_block_loaded_data_columns(load_set_block) }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def entity_info
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      render json: { success: true, data: Grit::Core::EntityLoader.load_set_block_entity_info(load_set_block) }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
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

    def export_errored_rows
      raise "No load set block id provided" if params[:load_set_block_id].nil?
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])
      columns = load_set_block.headers
      scope = load_set_block.errored_rows

      Grit::Core::Exporter.scope_to_csv(scope, columns) do |file|
        send_data file.read, filename: "#{load_set_block.name}_errored_rows.csv", content_type: "application/csv"
      end
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def export_errors
      raise "No load set block id provided" if params[:load_set_block_id].nil?
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])
      columns = [{"name" => "line", "display_name" => "Line"},{"name" => "column_name", "display_name" => "Column"},{"name" => "value", "display_name" => "Value"},{"name" => "error", "display_name" => "Error"}]
      scope = load_set_block.flattened_errors

      Grit::Core::Exporter.scope_to_csv(scope, columns) do |file|
        send_data file.read, filename: "#{load_set_block.name}_errors.csv", content_type: "application/csv"
      end
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def data
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

      send_data load_set_block.data.download, filename: load_set_block.data.filename.to_s, content_type: load_set_block.data.content_type, disposition: :inline
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def validate
      ActiveRecord::Base.transaction do
        begin
          load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])
          if load_set_block.status.name != "Mapping" && load_set_block.status.name != "Invalidated"
            render json: { success: false, errors: 'Only load set with "Mapping" or "Invalidated" status can be validated' }, status: :forbidden
            return
          end

          load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Validating").id
          load_set_block.mappings = params[:mappings] unless params[:mappings].nil?

          if load_set_block.mappings.nil?
            render json: { success: false, errors: "No mappings provided" }, status: :unprocessable_entity
            return
          end

          load_set_block.save!

          if !Grit::Core::EntityLoader.validate_load_set_block(load_set_block)
            load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Invalidated").id
            load_set_block.save!
            render json: { success: false, errors: "The data set contains errors" }, status: :unprocessable_entity
            return
          end

          load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Validated").id
          load_set_block.save!
          render json: { success: true, data: load_set_block }
        rescue StandardError => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: e.to_s }, status: :internal_server_error
          raise ActiveRecord::Rollback
        end
      end
    end

    def confirm
      ActiveRecord::Base.transaction do
        begin
          load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

          unless load_set_block.status.name == "Validated" || load_set_block.status.name == "Invalidated"
            render json: { success: false, errors: 'Only load set with "Validated" or "Invalidated" status can be confirmed' }, status: :forbidden
            return
          end

          Grit::Core::EntityLoader.confirm_load_set_block(load_set_block)

          load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Succeeded").id
          load_set_block.save!
          render json: { success: true, data: load_set_block }
        rescue StandardError => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: e.to_s }, status: :internal_server_error
          raise ActiveRecord::Rollback
        end
      end
    end

    def initialize_data
      load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])
      load_set_block.initialize_data
      render json: { success: true, data: load_set_block }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def rollback
      ActiveRecord::Base.transaction do
        begin
          load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

          Grit::Core::EntityLoader.rollback_load_set_block(load_set_block)

          load_set_block.status_id = Grit::Core::LoadSetStatus.find_by_name("Created").id
          load_set_block.save!
          render json: { success: true, data: load_set_block }
        rescue StandardError => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: e.to_s }, status: :internal_server_error
          raise ActiveRecord::Rollback
        end
      end
    end

    def set_mappings
      ActiveRecord::Base.transaction do
        begin
          load_set = Grit::Core::LoadSet.find(params[:load_set_id])

          unless [ "Mapping", "Invalidated" ].include? load_set.status.name
            render json: { success: false, errors: 'Only load set with "Mapping" or "Invalidated" status can be updated' }, status: :forbidden
            return
          end

          load_set.mappings = params[:mappings]
          load_set.record_errors = nil
          load_set.save

          render json: { success: true, data: load_set }
        rescue StandardError => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: e.to_s }, status: :internal_server_error
          raise ActiveRecord::Rollback
        end
      end
    end

    def set_data
      ActiveRecord::Base.transaction do
        begin
          load_set_block = Grit::Core::LoadSetBlock.find(params[:load_set_block_id])

          load_set_block = Grit::Core::EntityLoader.set_load_set_block_data(load_set_block, params.permit!.to_h.symbolize_keys)

          render json: { success: true, data: load_set_block }
          return
        rescue EntityLoader::MaxFileSizeExceededError => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: e.to_s }, status: :unprocessable_entity
        rescue StandardError => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: e.to_s }, status: :internal_server_error
        end
        raise ActiveRecord::Rollback
      end
    end

    private
      def permitted_params
        [ "name", "origin_id", "data", "mappings", "separator" ]
      end
  end
end
