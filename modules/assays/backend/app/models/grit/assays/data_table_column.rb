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
  class DataTableColumn < ApplicationRecord
    include Grit::Core::GritEntityRecord
    belongs_to :assay_data_sheet_column

    def self.pivotted(params = nil)
      max_pivot_count = self.unscoped.select("MAX(CARDINALITY(pivots))")[0][:max]

      query = self.detailed(params)
        .joins("JOIN GRIT_ASSAYS_ASSAY_DATA_SHEET_DEFINITIONS ON GRIT_ASSAYS_ASSAY_DATA_SHEET_DEFINITIONS.ID = GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS__.ASSAY_DATA_SHEET_DEFINITION_ID")
        .joins("JOIN GRIT_ASSAYS_ASSAY_MODELS ON GRIT_ASSAYS_ASSAY_MODELS.ID = GRIT_ASSAYS_ASSAY_DATA_SHEET_DEFINITIONS.ASSAY_MODEL_ID")

      full_name_selector = ["concat_ws(' ', GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS__.NAME"]
      full_safe_name_selector = ["regexp_replace(lower(concat_ws('_', GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS__.NAME"]
      model_metadatum_ids_selector = []
      vocabulary_item_ids_selector = []

      for i in 1..max_pivot_count do
        query = query.joins("LEFT OUTER JOIN GRIT_ASSAYS_ASSAY_METADATA GRIT_ASSAYS_ASSAY_METADATA_#{i} ON GRIT_ASSAYS_ASSAY_METADATA_#{i}.ASSAY_MODEL_METADATUM_ID = GRIT_ASSAYS_DATA_TABLE_COLUMNS.PIVOTS[#{i}]") if i == 1
        query = query.joins("LEFT OUTER JOIN GRIT_ASSAYS_ASSAY_METADATA GRIT_ASSAYS_ASSAY_METADATA_#{i} ON GRIT_ASSAYS_ASSAY_METADATA_#{i}.ASSAY_MODEL_METADATUM_ID = GRIT_ASSAYS_DATA_TABLE_COLUMNS.PIVOTS[#{i}] AND GRIT_ASSAYS_ASSAY_METADATA_#{2}.ASSAY_ID = GRIT_ASSAYS_ASSAY_METADATA_1.ASSAY_ID") unless i == 1
        query = query.joins("LEFT OUTER JOIN GRIT_CORE_VOCABULARY_ITEMS GRIT_CORE_VOCABULARY_ITEMS_#{i} ON GRIT_CORE_VOCABULARY_ITEMS_#{i}.ID = GRIT_ASSAYS_ASSAY_METADATA_#{i}.VOCABULARY_ITEM_ID")
        full_name_selector += ["GRIT_CORE_VOCABULARY_ITEMS_#{i}.name"]
        full_safe_name_selector += ["GRIT_CORE_VOCABULARY_ITEMS_#{i}.name"]
        model_metadatum_ids_selector += ["GRIT_ASSAYS_ASSAY_METADATA_#{i}.ASSAY_MODEL_METADATUM_ID"]
        vocabulary_item_ids_selector += ["GRIT_ASSAYS_ASSAY_METADATA_#{i}.VOCABULARY_ITEM_ID"]
      end
      full_name_selector = full_name_selector.join(", ") + ") as full_name"
      full_safe_name_selector = full_safe_name_selector.join(", ") +  ")), '[^a-z0-9]','_','g') as full_safe_name"
      model_metadatum_ids_selector = "array[" + model_metadatum_ids_selector.join(", ") + "] as model_metadatum_ids"
      vocabulary_item_ids_selector = "array[" + vocabulary_item_ids_selector.join(", ") + "] as vocabulary_item_ids"
      query
        .select(full_name_selector)
        .select(full_safe_name_selector)
        .select(model_metadatum_ids_selector)
        .select(vocabulary_item_ids_selector)
        .distinct(:full_safe_name)
    end

    def entity_join_statement
      if assay_data_sheet_column.data_type.is_entity
        return "LEFT OUTER JOIN #{assay_data_sheet_column.data_type.table_name} #{assay_data_sheet_column.data_type.table_name}__#{assay_data_sheet_column.safe_name} on #{assay_data_sheet_column.data_type.table_name}__#{assay_data_sheet_column.safe_name}.id = data_sources.entity_id_value"
      end
      ""
    end

    def sql_aggregate_method subquery
      # TODO: latest
      case assay_data_sheet_column.data_type.name
      when "string","text","date","datetime"
        return subquery.select("STRING_AGG(data_sources.#{assay_data_sheet_column.data_type.name}_value, ',') AS value")
      when "integer","decimal"
        return subquery.select("#{meta["aggregate_method"]}(data_sources.#{assay_data_sheet_column.data_type.name}_value) AS value")
      when "boolean"
        return subquery.select("#{meta["aggregate_method"]}(data_sources.boolean_value) AS value")
      else
        return subquery.select(*[
          "ARRAY_AGG(data_sources.entity_id_value) AS value",
          assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
            "STRING_AGG(#{assay_data_sheet_column.data_type.table_name}__#{assay_data_sheet_column.safe_name}.#{display_property[:name]}, ', ') AS value__#{display_property[:name]}"
          end
        ])
      end
    end

    def data_table_statements query

      pivotted_columns = DataTableColumn.pivotted.where(id: self.id)

      pivotted_columns.each do |pivotted_column|
        query = query.select("#{pivotted_column.full_safe_name}_join.value as #{pivotted_column.full_safe_name}")

        subquery = ExperimentDataSheetValue.unscoped
          .from("grit_assays_experiment_data_sheet_values targets")
          .select("targets.entity_id_value AS target_id")
          .select("data_sources.assay_data_sheet_column_id AS data_source_id")

        subquery = sql_aggregate_method(subquery)

        join = <<-SQL
JOIN grit_assays_experiment_data_sheet_values data_sources ON data_sources.experiment_data_sheet_record_id = targets.experiment_data_sheet_record_id
AND data_sources.assay_data_sheet_column_id = #{assay_data_sheet_column_id}
        SQL
        subquery = subquery.joins(join).group(:target_id, :data_source_id)

        if pivotted_columns.length > 1
          join = <<-SQL
JOIN GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS ON GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS.ID = TARGETS.EXPERIMENT_DATA_SHEET_RECORD_ID
JOIN GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS ON GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS.ID = GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS.EXPERIMENT_DATA_SHEET_ID
JOIN GRIT_ASSAYS_EXPERIMENTS ON GRIT_ASSAYS_EXPERIMENTS.ID = GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS.EXPERIMENT_ID
          SQL
          subquery = subquery.joins(join)

          pivotted_column.model_metadatum_ids.each_index do |i|
            join = <<-SQL
JOIN GRIT_ASSAYS_ASSAY_METADATA GRIT_ASSAYS_ASSAY_METADATA_#{i} ON GRIT_ASSAYS_ASSAY_METADATA_#{i}.ASSAY_ID = GRIT_ASSAYS_EXPERIMENTS.ASSAY_ID
AND GRIT_ASSAYS_ASSAY_METADATA_#{i}.ASSAY_MODEL_METADATUM_ID = #{pivotted_column.model_metadatum_ids[i]} AND GRIT_ASSAYS_ASSAY_METADATA_#{i}.VOCABULARY_ITEM_ID = #{pivotted_column.vocabulary_item_ids[i]}
            SQL
            subquery = subquery.joins(join)
          end
        end

        if assay_data_sheet_column.data_type.is_entity
          entity_join = <<-SQL
LEFT OUTER JOIN #{assay_data_sheet_column.data_type.table_name} #{assay_data_sheet_column.data_type.table_name}__#{pivotted_column.full_safe_name} ON
#{assay_data_sheet_column.data_type.table_name}__#{pivotted_column.full_safe_name}.id = data_sources.entity_id_value
          SQL

          subquery = subquery.joins(entity_join)

          assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
            query = query.select("#{pivotted_column.full_safe_name}_join.value__#{display_property[:name]} as #{pivotted_column.full_safe_name}__#{display_property[:name]}")
          end
        end

        column_join = <<-SQL
LEFT OUTER JOIN (
      #{subquery.to_sql}
) #{pivotted_column.full_safe_name}_join ON #{pivotted_column.full_safe_name}_join.target_id = targets.id
        SQL
        query = query.joins(column_join)
      end
      query
    end
  end
end
