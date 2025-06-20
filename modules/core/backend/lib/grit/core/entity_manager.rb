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
  class EntityManager
    include Singleton

    def initialize
      @entities = {}
      @table_to_model_name = {}
      @model_to_table_name = {}
      @discovered = false
    end

    def register(model)
      return unless @entities[model.name].nil?
      @table_to_model_name[model.table_name] = model.name
      @model_to_table_name[model.name] = model.table_name
      @entities[model.name] = {
          full_name: model.name,
          name: model.respond_to?("display_name") ?
            model.display_name :
            model.name.demodulize.underscore.humanize,
          plural: model.respond_to?("display_name") ?
            model.display_name :
            model.name.demodulize.underscore.humanize.pluralize,
          path: model.respond_to?("controller_path") ?
            model.controller_path : model.name.underscore.pluralize,
          dictionary: true
        }
    end

    def self.register(model)
      self.instance.register(model)
    end

    def unregister(model)
      model = model.constantize if model.is_a?(String)
      @table_to_model_name.delete(model.table_name)
      @model_to_table_name.delete(model.name)
      @entities.delete(model.name)
    end

    def self.unregister(model)
      self.instance.unregister(model)
    end

    def entities
      discover
      @entities
    end

    def self.entities
      self.instance.entities
    end

    def model_to_table_name(model_name)
      @model_to_table_name[model_name]
    end

    def self.model_to_table_name(model_name)
      self.instance.model_to_table_name(model_name)
    end

    def table_to_model_name(table_name)
      @table_to_model_name[table_name]
    end

    def self.table_to_model_name(table_name)
      self.instance.table_to_model_name(table_name)
    end

    def discover
      return if @discovered
      Zeitwerk::Loader.eager_load_namespace(Grit)
      ActiveRecord::Base.descendants.each do |model|
        next unless model.include?(Grit::Core::GritEntityRecord)
        next if model.module_parents.include?(Grit::Core::UserDefinedVocabularies)
        register(model)
      end
    end

    def self.discover
      self.instance.discover
    end
  end
end
