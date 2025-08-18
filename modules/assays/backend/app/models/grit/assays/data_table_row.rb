module Grit::Assays
  class DataTableRow < ApplicationRecord
    include Grit::Core::GritEntityRecord

    def self.entity_properties(**args)
      data_table_id = args[:data_table_id]
      data_table = DataTable.find(data_table_id)
      data_table_data_type_model = data_table.entity_data_type.model

      [
        { name: "id", display_name: "Id", type: "integer", required: true },
        *data_table_data_type_model.display_properties,
        DataTableColumn.where(data_table_id: data_table_id).order("sort ASC NULLS LAST").map do |table_colum|
          property = {
            name: table_colum.assay_data_sheet_column.safe_name,
            display_name: table_colum.assay_data_sheet_column.name,
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
      # query = data_table.data_type.model.unscoped.from(data_table.data_type.table_name, "targets").joins("JOIN grit_assays_data_table_entities ON grit_assays_data_table_entities.entity_id = #{data_table.data_type.table_name}.id AND grit_assays_data_table_entities.data_table_id = #{data_table_id}")
      # query = data_table.data_type.model.unscoped.joins("JOIN grit_assays_data_table_entities ON grit_assays_data_table_entities.entity_id = #{data_table.data_type.table_name}.id").where("grit_assays_data_table_entities.data_table_id" => data_table_id)

      query = query.select("targets.id as id", "targets.name as name")

      DataTableColumn.where(data_table_id: data_table_id).order("sort ASC NULLS LAST").all.each do |table_colum|
        join = <<-SQL
LEFT OUTER JOIN (
  SELECT
    targets.entity_id_value AS target_id,
    data_sources.assay_data_sheet_column_id AS data_source_id,
    avg(data_sources.integer_value) AS value
  FROM
    grit_assays_experiment_data_sheet_values targets
    JOIN grit_assays_experiment_data_sheet_values data_sources ON data_sources.experiment_data_sheet_record_id = targets.experiment_data_sheet_record_id
    AND data_sources.assay_data_sheet_column_id = #{table_colum.assay_data_sheet_column_id}
    -- JOIN grit_assays_experiment_data_sheet_records ON grit_assays_experiment_data_sheet_records.id = targets.experiment_data_sheet_record_id
    -- JOIN grit_assays_experiment_data_sheets ON grit_assays_experiment_data_sheets.id = grit_assays_experiment_data_sheet_records.experiment_data_sheet_id
    -- JOIN grit_assays_experiments ON grit_assays_experiments.id = grit_assays_experiment_data_sheets.experiment_id
    -- JOIN grit_assays_assay_metadata ON grit_assays_assay_metadata.assay_id = grit_assays_experiments.assay_id
    -- AND grit_assays_assay_metadata.vocabulary_item_id = 10303
    -- JOIN grit_assays_assay_model_metadata ON grit_assays_assay_model_metadata.id = grit_assays_assay_metadata.assay_model_metadatum_id
    -- AND grit_assays_assay_model_metadata.assay_metadata_definition_id = 10307
  GROUP BY
    target_id,
    data_source_id
) #{table_colum.assay_data_sheet_column.safe_name}_join ON #{table_colum.assay_data_sheet_column.safe_name}_join.target_id = targets.id
        SQL
        query = query.joins(join).select("#{table_colum.assay_data_sheet_column.safe_name}_join.value as #{table_colum.assay_data_sheet_column.safe_name}")
      end
      query
    end


    def self.detailed(params = nil)
      params = params.as_json
      return self.for_data_table(sheet.assay_data_sheet_definition_id, sheet.id) unless params["data_table_id"].nil?
      raise "'data_table_id' is required"
    end
  end
end
