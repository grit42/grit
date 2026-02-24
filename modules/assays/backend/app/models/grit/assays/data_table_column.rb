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
      create: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      update: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      destroy: [ "Administrator", "AssayAdministrator", "AssayUser" ]

    validates :name, uniqueness: { scope: :data_table_id, message: "has already been taken in this data table" }, length: { minimum: 1 }
    validates :safe_name, uniqueness: { scope: :data_table_id, message: "has already been taken in this data table" }, length: { minimum: 3, maximum: 30 }
    validates :safe_name, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :safe_name, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }
    validate :safe_name_not_conflict

    def safe_name_not_conflict
      return unless self.safe_name_changed?
      if Grit::Assays::DataTableRow.new.respond_to?(self.safe_name)
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

      AssayDataSheetColumn.detailed.where("grit_assays_assay_data_sheet_definitions__.result IS TRUE")
        .joins("JOIN grit_assays_assay_models grit_assays_assay_models__ ON grit_assays_assay_models__.id = grit_assays_assay_data_sheet_definitions__.assay_model_id")
        .joins("JOIN grit_core_publication_statuses gaamps on gaamps.id = grit_assays_assay_models__.publication_status_id and gaamps.name = 'Published'")
        .select("grit_assays_assay_models__.id as assay_model_id")
        .select("grit_assays_assay_models__.name as assay_model_id__name")
        .reorder("grit_assays_assay_data_sheet_definitions__.assay_model_id ASC", "grit_assays_assay_data_sheet_definitions__.sort ASC NULLS LAST", "grit_assays_assay_data_sheet_definitions__.id ASC", "grit_assays_assay_data_sheet_columns.sort ASC NULLS LAST")
        .joins <<-SQL
JOIN GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS__SOURCE_DATA_TYPE ON GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS__SOURCE_DATA_TYPE.ASSAY_DATA_SHEET_DEFINITION_ID = GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS.ASSAY_DATA_SHEET_DEFINITION_ID
AND GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS__SOURCE_DATA_TYPE.DATA_TYPE_ID = #{data_table.entity_data_type_id}
AND GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS.DATA_TYPE_ID <> #{data_table.entity_data_type_id}
      SQL
    end

    def sql_aggregate_method(subquery)
      if aggregation_method == "latest"
        if assay_data_sheet_column.data_type.is_entity
          return subquery.select(*[
            "data_sources.#{assay_data_sheet_column.safe_name} as value",
            assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
              "dtv__#{self.safe_name}__entities.#{display_property[:name]} AS value__#{display_property[:name]}"
            end
          ])
        end
        return subquery.select("data_sources.#{assay_data_sheet_column.safe_name} as value")
      end
      case assay_data_sheet_column.data_type.name
      when "integer", "decimal"
        case aggregation_method
        when "avg", "min", "max", "count", "stddev"
          return subquery.select("#{aggregation_method}(data_sources.#{assay_data_sheet_column.safe_name}) AS value")
        end
      when "date", "datetime"
        case aggregation_method
        when "min", "max", "count"
          return subquery.select("#{aggregation_method}(data_sources.#{assay_data_sheet_column.safe_name}) AS value")
        when "csv"
          return subquery.select("STRING_AGG(data_sources.#{assay_data_sheet_column.safe_name}::text, ', ') AS value")
        end
      when "boolean"
        case aggregation_method
        when "and", "or"
          return subquery.select("bool_#{aggregation_method}(data_sources.#{assay_data_sheet_column.safe_name}) AS value")
        when "count"
          return subquery.select("count(data_sources.#{assay_data_sheet_column.safe_name}) AS value")
        end
      when "string", "text"
        case aggregation_method
        when "count"
          return subquery.select("count(data_sources.#{assay_data_sheet_column.safe_name}) AS value")
        when "csv"
          return subquery.select("STRING_AGG(data_sources.#{assay_data_sheet_column.safe_name}, ', ') AS value")
        end
      else
        case aggregation_method
        when "count"
          return subquery.select(*[
            "count(data_sources.#{assay_data_sheet_column.safe_name}) AS value",
            assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
              "count(dtv__#{self.safe_name}__entities.#{display_property[:name]}) AS value__#{display_property[:name]}"
            end
          ])
        when "csv"
          return subquery.select(*[
            "ARRAY_AGG(data_sources.#{assay_data_sheet_column.safe_name}) AS value",
            assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
              "STRING_AGG(dtv__#{self.safe_name}__entities.#{display_property[:name]}, ', ') AS value__#{display_property[:name]}"
            end
          ])
        end
      end
      raise "Unsupported aggregation method '#{aggregation_method}' for data table column with id='#{id}'"
    end

    def data_table_statement(query)
      return assay_data_sheet_column_query(query) if source_type == "assay_data_sheet_column"
      return entity_attribute_query(query) if source_type == "entity_attribute"
      raise "Unsupported source type: '#{source_type}'"
    end

    def entity_attribute_query(query)
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

    def experiments_join
      join = [ "JOIN EXPERIMENTS_WITH_METADATA ON EXPERIMENTS_WITH_METADATA.ID = DATA_SOURCES.EXPERIMENT_ID" ]
      join.push "EXPERIMENTS_WITH_METADATA.ID IN (#{self.experiment_ids.join(',')})" if self.experiment_ids.length.positive?
      metadata_definitions = AssayMetadataDefinition.all
      self.metadata_filters.each do |key, value|
        metadata_definition = metadata_definitions.find { |d| d.id.to_s == key.to_s }
        unless metadata_definition.nil? || value.nil? || value.blank?
          join.push "EXPERIMENTS_WITH_METADATA.#{metadata_definition.safe_name} IN (#{value.join(",")})"
        end
      end
      join.join(" AND ")
    end

    def join_entity_table(subquery)
      if assay_data_sheet_column.data_type.is_entity
        entity_join = <<-SQL
LEFT OUTER JOIN #{assay_data_sheet_column.data_type.table_name} dtv__#{self.safe_name}__entities ON
dtv__#{self.safe_name}__entities.id = data_sources.#{assay_data_sheet_column.safe_name}
        SQL
        subquery = subquery.joins(entity_join)
      end
      subquery
    end

    def select_entity_display_properties(query)
      if assay_data_sheet_column.data_type.is_entity
        assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
          query = query.select("#{self.safe_name}_join.value__#{display_property[:name]} as #{self.safe_name}__#{display_property[:name]}")
        end
      end
      query
    end

    def left_join_subquery(query, subquery)
      column_join = <<-SQL
LEFT OUTER JOIN (
  #{subquery.to_sql}
) #{self.safe_name}_join ON #{self.safe_name}_join.target_id = targets.id
      SQL
      query.joins(column_join)
    end

    def assay_data_sheet_column_query(query)
      return query if assay_data_sheet_column.nil?
      target_column = assay_data_sheet_column.assay_data_sheet_definition.assay_data_sheet_columns.find { |c| c.data_type_id == self.data_table.entity_data_type_id }
      assay_model_data_sheet_class = ExperimentDataSheetRecord.sheet_record_klass(assay_data_sheet_column.assay_data_sheet_definition_id)

      query = query.select("#{self.safe_name}_join.value as #{self.safe_name}")

      subquery = assay_model_data_sheet_class.unscoped
        .from("#{assay_model_data_sheet_class.table_name} data_sources")
        .joins(experiments_join)
        .joins("JOIN grit_assays_assay_models gaam on gaam.id = EXPERIMENTS_WITH_METADATA.assay_model_id")
        .joins("JOIN grit_core_publication_statuses gaeps on gaeps.id = EXPERIMENTS_WITH_METADATA.publication_status_id and gaeps.name = 'Published'")
        .joins("JOIN grit_core_publication_statuses gaamps on gaamps.id = gaam.publication_status_id and gaamps.name = 'Published'")


      if aggregation_method == "latest"
        subquery = subquery.select("DISTINCT ON (target_id) data_sources.#{target_column.safe_name} AS target_id")
          .order(:target_id, Arel.sql("COALESCE(data_sources.updated_at, data_sources.created_at) DESC"))
      else
        subquery = subquery.select("data_sources.#{target_column.safe_name} AS target_id")
          .group(:target_id)
      end

      subquery = sql_aggregate_method(subquery)
      subquery = join_entity_table(subquery)
      query = select_entity_display_properties(query)
      left_join_subquery(query, subquery)
    end

    def full_perspective_statement(query)
      return entity_attribute_query(query) if source_type == "entity_attribute"
      full_perspective_query(query)
    end

    def join_subquery(query, subquery)
      column_join = <<-SQL
JOIN (
  #{subquery.to_sql}
) #{self.safe_name}_join ON #{self.safe_name}_join.target_id = targets.id
      SQL
      query.joins(column_join)
    end

    def full_perspective_query(query)
      query = query.select(
        "#{self.safe_name}_join.value as #{self.safe_name}",
        "#{assay_data_sheet_column.assay_data_sheet_definition_id} as assay_data_sheet_definition_id",
        "#{self.safe_name}_join.experiment_id as experiment_id",
        "#{self.safe_name}_join.experiment_id__name as experiment_id__name",
      ).with(experiments_with_metadata: Experiment.detailed)

      target_column = assay_data_sheet_column.assay_data_sheet_definition.assay_data_sheet_columns.find { |c| c.data_type_id == self.data_table.entity_data_type_id }
      assay_model_data_sheet_class = ExperimentDataSheetRecord.sheet_record_klass(assay_data_sheet_column.assay_data_sheet_definition_id)

      subquery = assay_model_data_sheet_class.unscoped
        .from("#{assay_model_data_sheet_class.table_name} data_sources")
        .joins(experiments_join)
        .joins("JOIN grit_assays_assay_models gaam on gaam.id = EXPERIMENTS_WITH_METADATA.assay_model_id")
        .joins("JOIN grit_core_publication_statuses gaeps on gaeps.id = EXPERIMENTS_WITH_METADATA.publication_status_id and gaeps.name = 'Published'")
        .joins("JOIN grit_core_publication_statuses gaamps on gaamps.id = gaam.publication_status_id and gaamps.name = 'Published'")
        .select(
          aggregation_method == "latest" ?
            "DISTINCT ON (target_id) data_sources.#{target_column.safe_name} AS target_id" :
            "data_sources.#{target_column.safe_name} AS target_id",
          "data_sources.experiment_id",
          "EXPERIMENTS_WITH_METADATA.name as experiment_id__name",
        )

      if assay_data_sheet_column.data_type.is_entity
        subquery = subquery.select(*[
          "data_sources.#{assay_data_sheet_column.safe_name} as value",
          assay_data_sheet_column.data_type.model.display_properties.map do |display_property|
            "dtv__#{self.safe_name}__entities.#{display_property[:name]} AS value__#{display_property[:name]}"
          end
        ])
      else
        subquery = subquery.select("data_sources.#{assay_data_sheet_column.safe_name} as value")
      end

      if aggregation_method == "latest"
        subquery = subquery.order(:target_id, Arel.sql("COALESCE(data_sources.updated_at, data_sources.created_at) DESC"))
      end

      subquery = join_entity_table(subquery)
      query = select_entity_display_properties(query)
      join_subquery(query, subquery)
    end
  end
end
