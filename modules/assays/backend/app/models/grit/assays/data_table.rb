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

module Grit::Assays
  class DataTable < ApplicationRecord
    include Grit::Core::GritEntityRecord
    after_create :add_entity_type_display_columns

    belongs_to :entity_data_type, class_name: "Grit::Core::DataType"

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      update: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      destroy: [ "Administrator", "AssayAdministrator", "AssayUser" ]

    def self.entity_properties(**args)
      @entity_properties ||= self.db_properties.filter { |p| p[:name] != "plots" }.map { |p| p[:name] == "entity_data_type_id" ? {
        **p,
        entity: {
          **p[:entity],
          params: {
            scope: "entity_data_types"
          }
        }
      } : p }
    end

    def self.entity_fields(**args)
      @entity_fields ||= self.entity_fields_from_properties(self.entity_properties(**args))
    end

    def self.entity_columns(**args)
      @entity_columns ||= self.entity_columns_from_properties(self.entity_properties(**args))
    end

    def add_entity_type_display_columns
      logger.info entity_data_type.model.name
      self.entity_data_type.model.display_properties.each do |display_property|
        logger.info display_property.as_json
        begin
          DataTableColumn.create!(
            data_table_id: self.id,
            source_type: "entity_attribute",
            entity_attribute_name: display_property[:name],
            safe_name: "entity_#{display_property[:name]}",
            name: display_property[:display_name]
          )
        rescue StandardError => e
          logger.info e.to_s
          logger.info e.backtrace.join("\n")
        end
      end
    end
  end
end
