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
    include Grit::Core::Controller::Unforgeable
    include Grit::Core::Controller::Authenticated
    include Grit::Core::Controller::Readable
    include Grit::Core::Controller::Writable

    before_action :check_read, only: %i[ index show entity_info load_set_blocks ]
    before_action :check_write, only: %i[ create update destroy initialize_blocks cancel ]

    def create
      ActiveRecord::Base.transaction do
        begin
          record = Grit::Core::EntityLoader.create_load_set(params)
          render json: { success: true, data: record }, status: :created, location: record
          return
        rescue EntityLoader::MaxFileSizeExceededError => e
          logger.error e.to_s
          logger.error e.backtrace.join("\n")
          render json: { success: false, errors: { data: [ e.to_s ] } }, status: :unprocessable_entity
        rescue EntityLoader::ParseException => e
          logger.error e.to_s
          logger.error e.backtrace.join("\n")
          render json: { success: false, errors: { data: [ e.to_s ] } }, status: :unprocessable_entity
        rescue ActiveRecord::RecordInvalid => e
          logger.error e.to_s
          logger.error e.backtrace.join("\n")
          render json: { success: false, errors: e.record.errors }, status: :unprocessable_entity
        rescue ActiveRecord::RecordNotSaved => e
          logger.error e.to_s
          logger.error e.backtrace.join("\n")
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
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def cancel
      ActiveRecord::Base.transaction do
        Grit::Core::LoadSet.find(params[:id]).cancel
      end
      render json: { success: true }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def destroy
      render json: { success: false, errors: "Load sets must be cancelled" }, status: :forbidden
    end

    def entity_info
      render json: { success: true, data: Grit::Core::EntityLoader.load_set_entity_info(params) }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def load_set_blocks
      load_set = Grit::Core::LoadSet.find(params[:id])
      load_set_blocks = Grit::Core::EntityLoader.index_load_set_blocks(load_set).order("grit_core_load_set_blocks.id ASC")
      render json: { success: true, data: load_set_blocks }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def initialize_blocks
      load_set = Grit::Core::LoadSet.find(params[:id])
      load_set.initialize_blocks
      render json: { success: true }
    rescue StandardError => e
      logger.error e.to_s
      logger.error e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private
      def permitted_params
        [ :name, :entity, :origin_id, load_set_blocks: [ :name, :separator, mappings: {} ] ]
      end

      def check_read
        if params[:id].blank? && params[:entity].blank?
          render json: { success: false, errors: "'entity' not specified" }, status: :bad_request
          return
        end
        entity = params[:entity]
        if entity.blank?
          begin
            entity = Grit::Core::LoadSet.find(params[:id]).entity
          rescue ActiveRecord::RecordNotFound
            render json: { success: false, errors: "Not found" }, status: :not_found
            return
          end
        end

        Zeitwerk::Loader.eager_load_namespace(Grit)
        klass = ActiveRecord::Base.descendants.find { |m| m.include?(Grit::Core::GritEntityRecord) && m.name == entity }
        if klass.nil?
          render json: { success: false, errors: "Unknown entity" }, status: :bad_request
          return
        end

        render json: { success: false, errors: "You do not have the permissions required to read Grit::Core::LoadSet for entity #{entity}" }, status: :forbidden  if klass.entity_crud[:read].nil? or !current_user.permission?(klass.entity_crud[:read])
      end

      def check_write
        render json: { success: false }, status: :bad_request if params[:id].blank? && params[:entity].blank?
        entity = params[:entity]
        if entity.blank?
          entity = Grit::Core::LoadSet.find(params[:id]).entity
        end

        Zeitwerk::Loader.eager_load_namespace(Grit)
        klass = ActiveRecord::Base.descendants.find { |m| m.include?(Grit::Core::GritEntityRecord) && m.name == entity }
        if klass.nil?
          render json: { success: false, errors: "Unknown entity" }, status: :bad_request
          return
        end

        render json: { success: false, errors: "You do not have the permissions required to write Grit::Core::LoadSet for entity #{entity}" }, status: :forbidden  if klass.entity_crud[:write].nil? or !current_user.permission?(klass.entity_crud[:write])
      rescue ActiveRecord::RecordNotFound
        render json: { success: false, errors: "Not found" }, status: :not_found
      end
  end
end
