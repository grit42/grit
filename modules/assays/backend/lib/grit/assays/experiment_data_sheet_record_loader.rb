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

require "grit/core/entity_loader"

module Grit::Assays
  class ExperimentDataSheetRecordLoader < Grit::Core::EntityLoader
    protected
    def self.fields(params)
      experiment_data_sheet_record_load_set_fields = Grit::Assays::ExperimentDataSheetRecordLoadSet.entity_fields.to_h { |item| [ item[:name], item.dup ] }
      experiment_data_sheet_record_load_set_fields["experiment_id"][:disabled] = true unless experiment_data_sheet_record_load_set_fields["experiment_id"].nil?
      experiment_data_sheet_record_load_set_fields["experiment_data_sheet_id"][:disabled] = true unless experiment_data_sheet_record_load_set_fields["experiment_data_sheet_id"].nil?

      [ *super(params), *experiment_data_sheet_record_load_set_fields.values ]
    end

    def self.show(load_set)
      experiment_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
      return load_set.as_json if experiment_load_set.nil?
      { **experiment_load_set.as_json, **load_set.as_json }
    end

    def self.create(params)
      data = read_data(params[:data].tempfile)
      separator = params[:separator]

      parsed_data = self.parse(data, separator)

      load_set = Grit::Core::LoadSet.new({
        name: params[:name],
        entity: "Grit::Assays::ExperimentDataSheetRecord",
        data: data,
        parsed_data: parsed_data,
        separator: separator,
        origin_id: params[:origin_id],
        status_id: Grit::Core::LoadSetStatus.find_by(name: "Mapping").id
      })
      load_set.save!

      record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.new({
        load_set_id: load_set.id,
        experiment_id: params[:experiment_id],
        experiment_data_sheet_id: params[:experiment_data_sheet_id]
      })
      record_load_set.save!

      load_set
    end

    def self.destroy(load_set)
      Grit::Assays::ExperimentDataSheetRecordLoadSet.destroy_by(load_set_id: load_set.id)
      super
    end


    def self.load_set_record_klass(record_load_set)
      sheet = Grit::Assays::AssayDataSheetDefinition.includes(assay_data_sheet_columns: [ :data_type ]).find(Grit::Assays::ExperimentDataSheet.find(record_load_set.experiment_data_sheet_id).assay_data_sheet_definition_id)
      klass = Class.new(ActiveRecord::Base) do
        self.table_name = "ls_#{record_load_set.load_set_id}"
        @sheet = sheet

        def self.detailed(params = nil)
          query = self.unscoped
            .select("#{self.table_name}.id")
            .select("#{self.table_name}.errors")

          @sheet.assay_data_sheet_columns.each do |column|
            query = query.select("#{self.table_name}.#{column.safe_name}")
            if column.data_type.is_entity
              entity_klass = column.data_type.model
              query = query
                .joins("LEFT OUTER JOIN #{column.data_type.table_name} #{column.safe_name}__entities on #{column.safe_name}__entities.id = #{@sheet.table_name}.#{column.safe_name}")
              for display_property in entity_klass.display_properties do
                query = query
                  .select("#{column.safe_name}__entities.#{display_property[:name]} as #{column.safe_name}__#{display_property[:name]}") unless entity_klass.display_properties.nil?
              end
            end
          end
          query
        end
      end
      klass
    end

    def self.create_temporary_table(record_load_set)
      columns = AssayDataSheetColumn.where(assay_data_sheet_definition_id: Grit::Assays::ExperimentDataSheet.find(record_load_set.experiment_data_sheet_id).assay_data_sheet_definition_id).order("sort ASC NULLS LAST")
      migration = ActiveRecord::Migration.new
      migration.drop_table "ls_#{record_load_set.load_set_id}", if_exists: true
      migration.create_table "ls_#{record_load_set.load_set_id}", id: :bigint, if_not_exists: true do |t|
        columns.each do |column|
          if column.data_type.is_entity
            t.column column.safe_name, :bigint
          else
            t.column column.safe_name, column.data_type.name
          end
        end
        t.column :number, :bigint
        t.column :errors, :jsonb
      end
    end



    def self.validate(load_set)
      record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
      load_set_entity_properties = Grit::Assays::ExperimentDataSheetRecord.entity_fields(experiment_data_sheet_id: record_load_set.experiment_data_sheet_id).filter { |f| f[:name] != "experiment_data_sheet_id" }

      data = load_set.parsed_data[1..]
      errors = []

      records = []

      Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
      Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)

      ExperimentDataSheetRecordLoader.create_temporary_table(record_load_set)
      load_set_record_klass = ExperimentDataSheetRecordLoader.load_set_record_klass(record_load_set)

      data.each_with_index do |datum, index|
        record = {
          number: index,
          errors: nil,
        }

        load_set_entity_properties.each do |entity_property|
          entity_property_name = entity_property[:name].to_s
          mapping = load_set.mappings[entity_property_name]
          next if mapping.nil?
          find_by = mapping["find_by"]
          header_index = mapping["header"].to_i unless mapping["header"].nil? or mapping["header"].blank?
          value = nil
          if mapping["constant"]
            value = mapping["value"]
          elsif !find_by.blank? and !datum[header_index].blank?
            begin
              field_entity = entity_property[:entity][:full_name].constantize
              value = field_entity.loader_find_by!(find_by, datum[header_index], options: entity_property[:entity][:options]).id
            rescue NameError
              record[:errors] ||= {}
              record[:errors][entity_property_name] = [ "#{entity_property[:entity][:name]}: No such model" ]
              value = 0
            rescue ActiveRecord::RecordNotFound
              record[:errors] ||= {}
              record[:errors][entity_property_name] = [ "could not find #{entity_property[:entity][:name]} with '#{find_by}' = #{datum[header_index]}" ]
              value = 0
            end
          elsif !header_index.nil?
            value = datum[header_index]
          end

          record[entity_property_name] = value

          if entity_property[:required] && value.nil?
            record[:errors] ||= {}
            record[:errors][entity_property_name] = [ "can't be blank" ]
          elsif (entity_property[:type].to_s == "integer" or entity_property[:type].to_s == "float" or entity_property[:type].to_s == "decimal") and !value.nil? and !value.blank? and !/^[+\-]?(\d+\.\d*|\d*\.\d+|\d+)([eE][+\-]?\d+)?$/.match?(value.to_s)
            record[:errors] ||= {}
            record[:errors][entity_property_name] = [ "is not a number" ]
          elsif entity_property[:type].to_s == "datetime" and !value.nil? and !value.blank?
            begin
              record[entity_property_name] = DateTime.parse(value)
            rescue
              record[:errors] ||= {}
              record[:errors][entity_property_name] = [ "Unable to parse datetime, please use YYYY/MM/DD HH:mm:ss or ISO 8601" ]
            end
          elsif entity_property[:type].to_s == "date" and !value.nil? and !value.blank?
            begin
              record[entity_property_name] = Date.parse(value)
            rescue
              record[:errors] ||= {}
              record[:errors][entity_property_name] = [ "Unable to parse date, please use YYYY/MM/DD or ISO 8601" ]
            end
          end
        end

        unless record[:errors].nil?
          errors.push({ index: index, datum: datum, errors: record[:errors] })
        end
        records.push record
      end
      load_set_record_klass.insert_all(records)
      { errors: errors }
    end

    def self.confirm(load_set)
      record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
      load_set_entity_properties = Grit::Assays::ExperimentDataSheetRecord.entity_fields(experiment_data_sheet_id: record_load_set.experiment_data_sheet_id).filter { |f| f[:name] != "experiment_data_sheet_id" }

      ActiveRecord::Base.transaction do
        load_set_loaded_records = []

        Grit::Core::LoadSetLoadingRecord.includes(:load_set_loading_record_property_values).where(load_set_id: load_set.id).each do |loading_record|
          record_props = {}
          record_props["experiment_data_sheet_id"] = record_load_set.experiment_data_sheet_id
          loading_record.load_set_loading_record_property_values.each do |loading_record_property_value|
            entity_property = load_set_entity_properties.find { |p| p[:name] == loading_record_property_value.name }
            if entity_property[:type] == "entity"
              record_props[loading_record_property_value.name] = loading_record_property_value.entity_id_value
            else
              record_props[loading_record_property_value.name] = loading_record_property_value["#{entity_property[:type]}_value"]
            end
          end

          record = Grit::Assays::ExperimentDataSheetRecord.create(record_props)

          load_set_loaded_records.push({
            load_set_id: load_set.id,
            table: "grit_assays_experiment_data_sheet_records",
            record_id: record.id
          })

          record.experiment_data_sheet_values.each do |experiment_data_sheet_value|
            load_set_loaded_records.push({
              load_set_id: load_set.id,
              table: "grit_assays_experiment_data_sheet_values",
              record_id: experiment_data_sheet_value.id
            })
          end
        end

        Grit::Core::LoadSetLoadedRecord.insert_all(load_set_loaded_records)

        Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
        Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)
      end
    end

    def self.mapping_fields(load_set)
      record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: load_set.id)
      Grit::Assays::ExperimentDataSheetRecord.entity_fields(experiment_data_sheet_id: record_load_set.experiment_data_sheet_id).filter { |f| f[:name] != "experiment_data_sheet_id" }
    end
  end
end
