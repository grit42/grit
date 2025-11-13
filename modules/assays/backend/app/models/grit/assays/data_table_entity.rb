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
  class DataTableEntity < ApplicationRecord
    include Grit::Core::GritEntityRecord

    validates :entity_id, uniqueness: { scope: :data_table_id, message: "has already been included in the data table" }

    entity_crud_with read: [],
      create: ["Administrator", "AssayAdministrator", "AssayUser"],
      update: ["Administrator", "AssayAdministrator", "AssayUser"],
      destroy: ["Administrator", "AssayAdministrator", "AssayUser"]

    def self.entity_properties(**args)
      DataTable.find(args[:data_table_id]).entity_data_type.model.entity_properties(**args)
    end

    def self.entity_fields(**args)
      self.entity_fields_from_properties(self.entity_properties(**args))
    end

    def self.entity_columns(**args)
      self.entity_columns_from_properties(self.entity_properties(**args))
    end

    def self.detailed(params = nil)
      model = DataTable.find(params[:data_table_id]).entity_data_type.model
      model.detailed(params)
        .joins("JOIN grit_assays_data_table_entities ON grit_assays_data_table_entities.entity_id = #{model.table_name}.id AND grit_assays_data_table_entities.data_table_id = #{params[:data_table_id]}")
        .select("grit_assays_data_table_entities.id as data_table_entity_id")
        .select("grit_assays_data_table_entities.data_table_id")
        .select("grit_assays_data_table_entities.sort")
        .order("grit_assays_data_table_entities.sort ASC NULLS LAST")
    end

    def self.available(params = nil)
      data_type = DataTable.find(params[:data_table_id]).entity_data_type
      query = data_type.model_scope("detailed", params)
        .joins("LEFT OUTER JOIN grit_assays_data_table_entities ON grit_assays_data_table_entities.entity_id = #{data_type.table_name}.id AND grit_assays_data_table_entities.data_table_id = #{params[:data_table_id]}")
        .where("grit_assays_data_table_entities.id IS NULL")
      query
    end
  end
end
