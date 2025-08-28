module Grit::Assays
  class DataTableRow < ApplicationRecord
    include Grit::Core::GritEntityRecord

    entity_crud_with read: []

    def self.entity_properties(**args)
      data_table_id = args[:data_table_id]
      data_table = DataTable.find(data_table_id)
      data_table_data_type_model = data_table.entity_data_type.model

      [
        { name: "id", display_name: data_table.entity_data_type.name, type: "entity", required: true, entity: data_table.entity_data_type.entity_definition },
        *DataTableColumn.pivotted({data_table_id: data_table_id}).order("sort ASC NULLS LAST").map do |table_colum|
          property = {
            name: table_colum.full_safe_name,
            display_name: table_colum.full_name,
            description: table_colum.assay_data_sheet_column.description,
            type: table_colum.assay_data_sheet_column.data_type.is_entity ? "entity" : table_colum.assay_data_sheet_column.data_type.name,
            required: table_colum.assay_data_sheet_column.required,
            unique: false,
            entity: table_colum.assay_data_sheet_column.data_type.entity_definition
          }
          property
        end
      ]
    end

    def self.entity_fields(**args)
      self.entity_fields_from_properties(self.entity_properties(**args))
    end

    def self.entity_columns(**args)
      self.entity_columns_from_properties(self.entity_properties(**args))
    end

    def self.for_data_table(data_table_id)
      data_table = DataTable.find(data_table_id)
      query = data_table.entity_data_type.model.unscoped.from("#{data_table.entity_data_type.table_name} as targets").joins("JOIN grit_assays_data_table_entities ON grit_assays_data_table_entities.entity_id = targets.id AND grit_assays_data_table_entities.data_table_id = #{data_table_id}")

      query = query.select("targets.id as id", "targets.name as id__name")

      DataTableColumn.where(data_table_id: data_table_id).order("sort ASC NULLS LAST").all.each do |table_colum|
        query = table_colum.data_table_statements(query)
      end
      query
    end


    def self.detailed(params = nil)
      params = params.as_json
      return self.for_data_table(params["data_table_id"]) unless params["data_table_id"].nil?
      raise "'data_table_id' is required"
    end
  end
end
