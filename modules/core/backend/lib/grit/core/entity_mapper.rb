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
  class EntityMapper
    @table_to_model_name = nil
    @model_to_table_name = nil

    def self.grit_entity_classes
      Zeitwerk::Loader.eager_load_namespace(Grit)
      ActiveRecord::Base.descendants.select do |m|
        m.include?(Grit::Core::GritEntityRecord) && !m.name.blank?
      end
    end

    def self.find_entity_class(name)
      grit_entity_classes.find { |m| m.name == name }
    end

    def self.discover
      @table_to_model_name = {}
      @model_to_table_name = {}
      grit_entity_classes.each do |model|
        @table_to_model_name[model.table_name] = model.name
        @model_to_table_name[model.name] = model.table_name
      end
    end

    def self.model_to_table_name(model_name)
      discover if @model_to_table_name.nil?
      @model_to_table_name[model_name]
    end

    def self.table_to_model_name(table_name)
      discover if @table_to_model_name.nil?
      @table_to_model_name[table_name]
    end
  end
end
