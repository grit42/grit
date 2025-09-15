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
  end
end
