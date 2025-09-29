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
    belongs_to :assay_data_sheet_column, optional: true
    belongs_to :data_table

    entity_crud_with read: [],
      create: ["Administrator", "AssayAdministrator", "AssayUser"],
      update: ["Administrator", "AssayAdministrator", "AssayUser"],
      destroy: ["Administrator", "AssayAdministrator", "AssayUser"]

    validates :safe_name, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :safe_name, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }
    validate :safe_name_not_conflict

    def safe_name_not_conflict
      return unless self.safe_name_changed?
      if Grit::Assays::DataTableColumn.respond_to?(self.safe_name)
        errors.add("safe_name", "cannot be used as a safe name")
      end
    end

    def self.detailed(params = {})
      self.detailed_scope(params)
        .joins("LEFT OUTER JOIN grit_assays_assay_data_sheet_definitions ON grit_assays_assay_data_sheet_definitions.id = grit_assays_assay_data_sheet_columns__.assay_data_sheet_definition_id")
        .joins("LEFT OUTER JOIN grit_assays_assay_models ON grit_assays_assay_models.id = grit_assays_assay_data_sheet_definitions.assay_model_id")
        .joins("LEFT OUTER JOIN grit_core_data_types ON grit_core_data_types.id = grit_assays_assay_data_sheet_columns__.data_type_id")
        .select("grit_assays_assay_data_sheet_definitions.id as assay_data_sheet_definition_id")
        .select("grit_assays_assay_data_sheet_definitions.name as assay_data_sheet_definition_id__name")
        .select("grit_assays_assay_models.id as assay_model_id")
        .select("grit_assays_assay_models.name as assay_model_id__name")
        .select("grit_core_data_types.id as data_type_id")
        .select("grit_core_data_types.name as data_type_id__name")
        .order("id ASC NULLS LAST")
    end

    def self.selected(params = {})
      params = params.as_json
      raise "'data_table_id' is required" if params["data_table_id"].nil?
      query = self.detailed(params)
        .joins("LEFT OUTER JOIN grit_assays_assay_data_sheet_definitions ON grit_assays_assay_data_sheet_definitions.id = grit_assays_assay_data_sheet_columns__.assay_data_sheet_definition_id")
        .joins("LEFT OUTER JOIN grit_assays_assay_models ON grit_assays_assay_models.id = grit_assays_assay_data_sheet_definitions.assay_model_id")
        .select("grit_assays_assay_data_sheet_definitions.id as assay_data_sheet_definition_id")
        .select("grit_assays_assay_data_sheet_definitions.name as assay_data_sheet_definition_id__name")
        .select("grit_assays_assay_models.id as assay_model_id")
        .select("grit_assays_assay_models.name as assay_model_id__name")
        .where(data_table_id: params["data_table_id"])

      query = query.where(source_type: params["source_type"]) unless params["source_type"].nil?
      query
    end

    def self.available_entity_attributes(params = nil)
      params = params.as_json
      raise "'data_table_id' is required" if params["data_table_id"].nil?
      data_table = DataTable.find(params["data_table_id"])

      "SELECT name,safe_name FROM (VALUES #{data_table.entity_data_type.model.entity_properties.reject { |e| e[:name] == "id" }.map { |e| "('#{e[:display_name]}', '#{e[:name]}')" }.join(",") }) values(name,safe_name)"
    end

    def self.available(params = nil)
      params = params.as_json
      raise "'data_table_id' is required" if params["data_table_id"].nil?
      data_table = DataTable.find(params["data_table_id"])

      return AssayDataSheetColumn.detailed.where("grit_assays_assay_data_sheet_definitions__.result IS TRUE")
        .joins("JOIN grit_assays_assay_models grit_assays_assay_models__ ON grit_assays_assay_models__.id = grit_assays_assay_data_sheet_definitions__.assay_model_id")
        .select("grit_assays_assay_models__.id as assay_model_id")
        .select("grit_assays_assay_models__.name as assay_model_id__name")
        .reorder("grit_assays_assay_data_sheet_definitions__.assay_model_id ASC", "grit_assays_assay_data_sheet_definitions__.sort ASC NULLS LAST", "grit_assays_assay_data_sheet_definitions__.id ASC", "grit_assays_assay_data_sheet_columns.sort ASC NULLS LAST")
        .joins <<-SQL
JOIN GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS__SOURCE_DATA_TYPE ON GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS__SOURCE_DATA_TYPE.ASSAY_DATA_SHEET_DEFINITION_ID = GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS.ASSAY_DATA_SHEET_DEFINITION_ID
AND GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS__SOURCE_DATA_TYPE.DATA_TYPE_ID = #{data_table.entity_data_type_id}
AND GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS.DATA_TYPE_ID <> #{data_table.entity_data_type_id}
      SQL
    end

    def sql_aggregate_method subquery
      if aggregation_method == "latest"
        if assay_data_sheet_column.data_type.is_entity
          return subquery.select(*[
            "data_sources.entity_id_value as value",
            assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
              "#{assay_data_sheet_column.data_type.table_name}__#{assay_data_sheet_column.safe_name}.#{display_property[:name]} AS value__#{display_property[:name]}"
            end
          ])
        end
        return subquery.select("data_sources.#{assay_data_sheet_column.data_type.name}_value as value")
      end
      case assay_data_sheet_column.data_type.name
      when "integer","decimal"
        case aggregation_method
        when "avg","min","max","count","stddev"
          return subquery.select("#{aggregation_method}(data_sources.#{assay_data_sheet_column.data_type.name}_value) AS value")
        end
      when "date","datetime"
        case aggregation_method
        when "min","max","count"
          return subquery.select("#{aggregation_method}(data_sources.#{assay_data_sheet_column.data_type.name}_value) AS value")
        when "csv"
          return subquery.select("STRING_AGG(data_sources.#{assay_data_sheet_column.data_type.name}_value::text, ', ') AS value")
        end
      when "boolean"
        case aggregation_method
        when "and","or"
          return subquery.select("boolean_#{aggregation_method}(data_sources.boolean_value) AS value")
        when "count"
          return subquery.select("count(data_sources.boolean_value) AS value")
        end
      when "string","text"
        case aggregation_method
        when "count"
          return subquery.select("count(data_sources.#{assay_data_sheet_column.data_type.name}_value) AS value")
        when "csv"
          return subquery.select("STRING_AGG(data_sources.#{assay_data_sheet_column.data_type.name}_value, ', ') AS value")
        end
      else
        case aggregation_method
        when "count"
          return subquery.select(*[
            "count(data_sources.entity_id_value) AS value",
            assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
              "count(#{assay_data_sheet_column.data_type.table_name}__#{assay_data_sheet_column.safe_name}.#{display_property[:name]}) AS value__#{display_property[:name]}"
            end
          ])
        when "csv"
          return subquery.select(*[
            "ARRAY_AGG(data_sources.entity_id_value) AS value",
            assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
              "STRING_AGG(#{assay_data_sheet_column.data_type.table_name}__#{assay_data_sheet_column.safe_name}.#{display_property[:name]}, ', ') AS value__#{display_property[:name]}"
            end
          ])
        end
      end
      raise "Unsupported aggregation method '#{aggregation_method}' for data table column with id='#{id}'"
    end

    def data_table_statement query
      return assay_data_sheet_column_query(query) if source_type == "assay_data_sheet_column"
      return entity_attribute_query(query) if source_type == "entity_attribute"
      raise "Unsupported source type: '#{source_type}'"
    end

    def entity_attribute_query query
      query = query.select("#{self.safe_name}_join.#{entity_attribute_name} as #{self.safe_name}")
      entity_klass = data_table.entity_data_type.model
      entity_property = entity_klass.entity_properties.find { |p| p[:name] == entity_attribute_name }
      if entity_property[:type] == "entity"
        foreign_klass = entity_property[:entity][:full_name].constantize
        foreign_klass_display_properties = foreign_klass.display_properties
        query = query.select("#{self.safe_name}_join.#{entity_attribute_name}__#{foreign_klass_display_properties[0][:name]} as #{self.safe_name}__#{foreign_klass_display_properties[0][:name]}")
      end
      subquery = self.data_table.entity_data_type.model_scope.select("\"#{data_table.entity_data_type.table_name}\".id as target_id")
        column_join = <<-SQL
LEFT OUTER JOIN (
      #{subquery.to_sql}
) \"#{self.safe_name}_join\" ON \"#{self.safe_name}_join\".target_id = targets.id
        SQL
      query.joins(column_join)
    end

    def join_data_sources subquery
      join = <<-SQL
JOIN grit_assays_experiment_data_sheet_values data_sources ON data_sources.experiment_data_sheet_record_id = targets.experiment_data_sheet_record_id
AND data_sources.assay_data_sheet_column_id = #{assay_data_sheet_column_id}
JOIN GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS ON GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS.ID = TARGETS.EXPERIMENT_DATA_SHEET_RECORD_ID
JOIN GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS ON GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS.ID = GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS.EXPERIMENT_DATA_SHEET_ID
JOIN GRIT_ASSAYS_EXPERIMENTS ON GRIT_ASSAYS_EXPERIMENTS.ID = GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS.EXPERIMENT_ID#{" AND GRIT_ASSAYS_EXPERIMENTS.ASSAY_ID IN (#{self.pivots.join(',')})" if self.pivots.length.positive?}
JOIN GRIT_CORE_PUBLICATION_STATUSES GRIT_CORE_PUBLICATION_STATUSES__experiments ON GRIT_CORE_PUBLICATION_STATUSES__experiments.id = GRIT_ASSAYS_EXPERIMENTS.publication_status_id AND GRIT_CORE_PUBLICATION_STATUSES__experiments.name = 'Published'
JOIN GRIT_ASSAYS_ASSAYS ON GRIT_ASSAYS_ASSAYS.id = GRIT_ASSAYS_EXPERIMENTS.assay_id
JOIN GRIT_CORE_PUBLICATION_STATUSES GRIT_CORE_PUBLICATION_STATUSES__assays ON GRIT_CORE_PUBLICATION_STATUSES__assays.id = GRIT_ASSAYS_ASSAYS.publication_status_id AND GRIT_CORE_PUBLICATION_STATUSES__assays.name = 'Published'
JOIN GRIT_ASSAYS_ASSAY_MODELS ON GRIT_ASSAYS_ASSAY_MODELS.id = GRIT_ASSAYS_ASSAYS.assay_model_id
JOIN GRIT_CORE_PUBLICATION_STATUSES GRIT_CORE_PUBLICATION_STATUSES__assay_models ON GRIT_CORE_PUBLICATION_STATUSES__assay_models.id = GRIT_ASSAYS_ASSAYS.publication_status_id AND GRIT_CORE_PUBLICATION_STATUSES__assay_models.name = 'Published'
      SQL

      subquery.joins(join)
    end

    def metadata_filters subquery
      join = <<-SQL
JOIN GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS ON GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS.ID = TARGETS.EXPERIMENT_DATA_SHEET_RECORD_ID
JOIN GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS ON GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS.ID = GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS.EXPERIMENT_DATA_SHEET_ID
JOIN GRIT_ASSAYS_EXPERIMENTS ON GRIT_ASSAYS_EXPERIMENTS.ID = GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS.EXPERIMENT_ID
      SQL

      join += " AND GRIT_ASSAYS_EXPERIMENTS.ASSAY_ID IN (#{self.pivots.join(',')})" if self.pivots.length.positive?
      subquery.joins(join)
    end

    def join_entity_table subquery
      if assay_data_sheet_column.data_type.is_entity
        entity_join = <<-SQL
LEFT OUTER JOIN #{assay_data_sheet_column.data_type.table_name} #{assay_data_sheet_column.data_type.table_name}__#{assay_data_sheet_column.safe_name} ON
#{assay_data_sheet_column.data_type.table_name}__#{assay_data_sheet_column.safe_name}.id = data_sources.entity_id_value
        SQL
        subquery = subquery.joins(entity_join)
      end
      subquery
    end

    def select_entity_display_properties query
      if assay_data_sheet_column.data_type.is_entity
        assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
          query = query.select("#{self.safe_name}_join.value__#{display_property[:name]} as #{self.safe_name}__#{display_property[:name]}")
        end
      end
      query
    end

    def left_join_subquery query, subquery
      column_join = <<-SQL
LEFT OUTER JOIN (
  #{subquery.to_sql}
) #{self.safe_name}_join ON #{self.safe_name}_join.target_id = targets.id
      SQL
      query.joins(column_join)
    end

    def assay_data_sheet_column_query query
        query = query.select("#{self.safe_name}_join.value as #{self.safe_name}")

        subquery = ExperimentDataSheetValue.unscoped
          .from("grit_assays_experiment_data_sheet_values targets")
        if aggregation_method == "latest"
          subquery = subquery.select("DISTINCT ON (target_id, data_source_id) targets.entity_id_value AS target_id, data_sources.assay_data_sheet_column_id AS data_source_id")
            .order(:target_id, :data_source_id, Arel.sql("COALESCE(data_sources.updated_at, data_sources.created_at) DESC"))
        else
          subquery = subquery.select("targets.entity_id_value AS target_id", "data_sources.assay_data_sheet_column_id AS data_source_id")
            .group(:target_id, :data_source_id)
        end

        subquery = sql_aggregate_method(subquery)
        subquery = join_data_sources(subquery)
        subquery = join_entity_table(subquery)
        query = select_entity_display_properties(query)
        left_join_subquery(query, subquery)
    end

    def full_perspective_statement query
      return entity_attribute_query(query) if source_type == "entity_attribute"
      return full_perspective_query(query)
    end

    def join_subquery query, subquery
      column_join = <<-SQL
JOIN (
  #{subquery.to_sql}
) #{self.safe_name}_join ON #{self.safe_name}_join.target_id = targets.id
      SQL
      query.joins(column_join)
    end

    def full_perspective_query query
      query = query.select(
        "#{self.safe_name}_join.value as #{self.safe_name}",
        "#{self.safe_name}_join.experiment_data_sheet_record_id as experiment_data_sheet_record_id",
        "#{self.safe_name}_join.experiment_data_sheet_id as experiment_data_sheet_id",
        "#{self.safe_name}_join.experiment_id as experiment_id",
        "#{self.safe_name}_join.experiment_id__name as experiment_id__name",
      )

      subquery = ExperimentDataSheetValue.unscoped
        .from("grit_assays_experiment_data_sheet_values targets")
        .select(
          "targets.entity_id_value AS target_id",
          "data_sources.assay_data_sheet_column_id AS data_source_id",
          "targets.experiment_data_sheet_record_id",
          "grit_assays_experiment_data_sheet_records.experiment_data_sheet_id",
          "grit_assays_experiment_data_sheets.experiment_id",
          "grit_assays_experiments.name as experiment_id__name"
        )

      if assay_data_sheet_column.data_type.is_entity
        subquery = subquery.select(*[
          "data_sources.entity_id_value as value",
          assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
            "#{assay_data_sheet_column.data_type.table_name}__#{assay_data_sheet_column.safe_name}.#{display_property[:name]} AS value__#{display_property[:name]}"
          end
        ])
      else
        subquery = subquery.select("data_sources.#{assay_data_sheet_column.data_type.name}_value as value")
      end

      if aggregation_method == "latest"
        subquery = subquery.order(Arel.sql("COALESCE(data_sources.updated_at, data_sources.created_at) DESC")).limit(1)
      end

      subquery = join_data_sources(subquery)
      subquery = join_entity_table(subquery)
      query = select_entity_display_properties(query)
      join_subquery(query, subquery)
    end
  end
end
