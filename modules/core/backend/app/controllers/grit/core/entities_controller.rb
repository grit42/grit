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

module Grit::Core
  class EntitiesController < ApplicationController
    include Grit::Core::Controller::Unforgeable
    include Grit::Core::Controller::Authenticated
    @entities = nil

    def entities
      if @entities.nil?
        Zeitwerk::Loader.eager_load_namespace(Grit)
        @entities = ActiveRecord::Base.descendants.each_with_object({}) do |model, memo|
          next if !model.include?(Grit::Core::GritEntityRecord) || model.name.blank?
          memo[model.name] = { full_name: model.name, name: model.name.demodulize.underscore.humanize, plural: model.name.demodulize.underscore.humanize.pluralize, path: model.name.underscore.pluralize, dictionary: true }
        end
      end
      @entities
    end

    def dictionary_entities
      self.entities.values.select { |entity| entity[:dictionary] }
    end

    def index
      render json: { success: true, data: dictionary_entities }
    end

    def show
      entity = params[:id]
      render json: { success: true, data: entities[entity] }
    end

    def columns
      klass = authorized_entity
      return if klass.nil?
      render json: { success: true, data: klass.entity_columns(**entity_args) }
    end

    def fields
      klass = authorized_entity
      return if klass.nil?
      render json: { success: true, data: klass.entity_fields(**entity_args) }
    end

    private

    def authorized_entity
      entity_id = params[:entity_id]
      unless entities.key?(entity_id)
        render json: { success: false, errors: "Unknown entity" }, status: :bad_request
        return nil
      end

      klass = entity_id.constantize
      crud = klass.entity_crud
      if crud.nil? || crud[:read].nil? || !current_user.permission?(crud[:read])
        render json: { success: false, errors: "You do not have the permissions required to read #{klass.name}" }, status: :forbidden
        return nil
      end

      klass
    end

    def entity_args
      params.permit(
        :data_table_id,
        :assay_data_sheet_definition_id,
        :experiment_id,
        :load_set_block_id,
        :load_set_id,
        :with_experiment_id
      ).to_h.symbolize_keys
    end
  end
end
