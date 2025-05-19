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
  class LoadSetsController < ApplicationController
    include Grit::Core::GritEntityController

    def create
      ActiveRecord::Base.transaction do
        begin
          record = Grit::Core::EntityLoader.create_load_set(params)
          render json: { success: true, data: record }, status: :created, location: record
          return
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

    def destroy
      id = params[:id]

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
      render json: { success: true, data: Grit::Core::EntityLoader.load_set_fields(params) }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def mapping_fields
      load_set = Grit::Core::LoadSet.find(params[:load_set_id])

      render json: { success: true, data: Grit::Core::EntityLoader.load_set_mapping_fields(load_set) }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def preview_data
      load_set = Grit::Core::LoadSet.find(params[:load_set_id])

      headers = load_set.parsed_data[0]
      data = load_set.parsed_data[1..]

      render json: { success: true, data: { headers: headers, data: data } }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def validate
      ActiveRecord::Base.transaction do
        begin
          load_set = Grit::Core::LoadSet.find(params[:load_set_id])
          if load_set.status.name != "Mapping"
            render json: { success: false, errors: 'Only load set with "Mapping" status can be validated' }, status: :forbidden
            return
          end

          load_set.status_id = Grit::Core::LoadSetStatus.find_by_name("Validating").id
          load_set.save!

          validation_results = Grit::Core::EntityLoader.validate_load_set(load_set)

          load_set.record_warnings = validation_results[:warnings]

          if validation_results[:errors].length > 0
            load_set.status_id = Grit::Core::LoadSetStatus.find_by_name("Invalidated").id
            load_set.record_errors = validation_results[:errors]
            load_set.save!
            render json: { success: false, errors: validation_results[:errors] }, status: :unprocessable_entity
            return
          end

          load_set.status_id = Grit::Core::LoadSetStatus.find_by_name("Validated").id
          load_set.save!
          render json: { success: true, data: load_set }
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
          load_set = Grit::Core::LoadSet.find(params[:load_set_id])

          unless load_set.status.name == "Validated"
            render json: { success: false, errors: 'Only load set with "Validated" status can be confirmed' }, status: :forbidden
          end

          Grit::Core::EntityLoader.confirm_load_set(load_set)

          load_set.status_id = Grit::Core::LoadSetStatus.find_by_name("Succeeded").id
          load_set.save!
          render json: { success: true, data: load_set }
        rescue StandardError => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
          render json: { success: false, errors: e.to_s }, status: :internal_server_error
          raise ActiveRecord::Rollback
        end
      end
    end

    def rollback
      ActiveRecord::Base.transaction do
        begin
          load_set = Grit::Core::LoadSet.find(params[:load_set_id])

          load_set_entity = load_set.entity.constantize

          load_set_entity.destroy_by("id IN (SELECT record_id FROM grit_core_load_set_loaded_records WHERE grit_core_load_set_loaded_records.load_set_id = #{load_set.id})")
          Grit::Core::LoadSetLoadedRecord.destroy_by(load_set_id: load_set.id)
          Grit::Core::LoadSetLoadingRecord.destroy_by(load_set_id: load_set.id)

          load_set.status_id = Grit::Core::LoadSetStatus.find_by_name("Mapping").id
          load_set.save!
          render json: { success: true, data: load_set }
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

    private
      def permitted_params
        [ "name", "entity", "origin_id", "data", "mappings" ]
      end
  end
end
