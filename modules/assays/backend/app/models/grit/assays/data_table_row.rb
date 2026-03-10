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
  class DataTableRow < ApplicationRecord
    self.table_name = "grit_assays_data_table_entities"
    include Grit::Core::GritEntityRecord

    entity_crud_with read: []

    def self.entity_properties(**args)
      data_table_id = args[:data_table_id]
      data_table = DataTable.find(data_table_id)
      data_table_data_type_model = data_table.entity_data_type.model

      DataTableColumn.detailed.where(data_table_id: data_table_id).map do |table_colum|
        if table_colum.source_type == "assay_data_sheet_column"
          property = {
            name: table_colum.safe_name,
            display_name: (table_colum.assay_data_sheet_column&.unit&.abbreviation.nil? || table_colum.aggregation_method == "count") ? table_colum.name : "#{table_colum.name} (#{table_colum.assay_data_sheet_column.unit.abbreviation})",
            description: table_colum.assay_data_sheet_column.description,
            type: table_colum.assay_data_sheet_column.data_type.is_entity ? "entity" : table_colum.assay_data_sheet_column.data_type.name,
            required: table_colum.assay_data_sheet_column.required,
            unique: false,
            entity: table_colum.assay_data_sheet_column.data_type.entity_definition,
            meta: {
              data_table: {
                source_type: "assay_data_sheet_column"
              }
            }
          }
        elsif table_colum.source_type == "entity_attribute"
          attribute = data_table_data_type_model.entity_properties.find { |p| p[:name] == table_colum.entity_attribute_name }
          raise "Entity attribute '#{table_colum.entity_attribute_name}' does not exist" if attribute.nil?
          property = {
            **attribute,
            name: table_colum.safe_name,
            display_name: table_colum.name,
            meta: {
              data_table: {
                source_type: "entity_attribute"
              }
            }
          }
        end
        property
      end
    end

    def self.entity_fields(**args)
      self.entity_fields_from_properties(self.entity_properties(**args))
    end

    def self.entity_columns(**args)
      self.entity_columns_from_properties(self.entity_properties(**args), [ "id" ])
    end

    def self.full_perspective(params = nil)
      params = params.as_json
      raise "'data_table_id' is required" if params["data_table_id"].nil?
      raise "'data_table_row_id' is required" if params["data_table_row_id"].nil?
      raise "'column_safe_name' is required" if params["column_safe_name"].nil?

      data_table = DataTable.find(params["data_table_id"])
      data_table_column = DataTableColumn.unscoped.find_by(data_table_id: params["data_table_id"], safe_name: params["column_safe_name"])

      query = data_table.entity_data_type.model.unscoped.from("#{data_table.entity_data_type.table_name} as targets")
       .where("targets.id" => params["data_table_row_id"])
       .joins("JOIN grit_assays_data_table_entities ON grit_assays_data_table_entities.entity_id = targets.id AND grit_assays_data_table_entities.data_table_id = #{data_table.id}")
       .order("grit_assays_data_table_entities.sort ASC NULLS LAST")
       .order("grit_assays_data_table_entities.id ASC NULLS LAST")

      query = query.select("targets.id as id")

      DataTableColumn.detailed
        .where(data_table_id: data_table.id)
        .where(source_type: "entity_attribute")
        .or(DataTableColumn.detailed.where(data_table_id: data_table.id).where(id: data_table_column.id))
        .each do |table_colum|
        query = table_colum.full_perspective_statement(query)
      end
      query
    end

    def self.for_data_table(data_table_id)
      data_table = DataTable.find(data_table_id)
      query = data_table.entity_data_type.model.unscoped.from("#{data_table.entity_data_type.table_name} as targets")
       .joins("JOIN grit_assays_data_table_entities ON grit_assays_data_table_entities.entity_id = targets.id AND grit_assays_data_table_entities.data_table_id = #{data_table.id}")
       .order("grit_assays_data_table_entities.sort ASC NULLS LAST")
       .order("grit_assays_data_table_entities.id ASC NULLS LAST")

      query = query.select("targets.id as id")
      data_table.entity_data_type.model.display_properties.each do |display_property|
        query = query.select("targets.#{display_property[:name]} as id__#{display_property[:name]}")
      end

      DataTableColumn.detailed.where(data_table_id: data_table.id).each do |table_colum|
        query = table_colum.data_table_statement(query)
      end
      query.with(experiments_with_metadata: Experiment.detailed)
    end


    def self.detailed(params = nil)
      params = params.as_json
      return self.for_data_table(params["data_table_id"]) unless params["data_table_id"].nil?
      raise "'data_table_id' is required"
    end
  end
end
