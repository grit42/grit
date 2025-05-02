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
    @entities = nil

    def entities
      if @entities.nil?
        Zeitwerk::Loader.eager_load_namespace(Grit)
        @entities = ActiveRecord::Base.descendants.each_with_object({}) do |model, memo|
          next if !model.include?(Grit::Core::GritEntityRecord)
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
      klass = params[:entity_id].constantize
      render json: { success: true, data: klass.entity_columns(**params.permit!.to_h.symbolize_keys) }
    end

    def fields
      klass = params[:entity_id].constantize
      render json: { success: true, data: klass.entity_fields(**params.permit!.to_h.symbolize_keys) }
    end
  end
end
