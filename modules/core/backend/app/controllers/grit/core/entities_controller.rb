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

require "grit/core/entity_manager"

module Grit::Core
  class EntitiesController < ApplicationController
    @entity = nil

    before_action :ensure_entity_exists, only: [ :show, :columns, :fields ]

    def dictionary_entities
      Grit::Core::EntityManager.entities.values.select { |entity| entity[:dictionary] }
    end

    def index
      render json: { success: true, data: dictionary_entities }
    end

    def show
      render json: { success: true, data: @entity }
    end

    def columns
      klass = @entity[:full_name].constantize
      render json: { success: true, data: klass.entity_columns(**params.permit!.to_h.symbolize_keys) }
    end

    def fields
      klass = @entity[:full_name].constantize
      render json: { success: true, data: klass.entity_fields(**params.permit!.to_h.symbolize_keys) }
    end

    def ensure_entity_exists
      @entity = Grit::Core::EntityManager.entities[params[:id]] unless params[:id].nil?
      @entity = Grit::Core::EntityManager.entities[params[:entity_id]] unless params[:entity_id].nil?
      if @entity.nil?
        render json: { success: false, errors: "Entity #{params[:id]} does not exist" }, status: :not_found
      end
    end
  end
end
