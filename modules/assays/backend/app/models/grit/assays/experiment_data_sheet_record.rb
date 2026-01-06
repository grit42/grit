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
  class ExperimentDataSheetRecord < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :experiment_data_sheet
    has_many :experiment_data_sheet_values, dependent: :destroy

    entity_crud_with create: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      read: [],
      update: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      destroy: [ "Administrator", "AssayAdministrator", "AssayUser" ]

    def self.sheet_record_klass(data_sheet_definition_id)
      sheet = Grit::Assays::AssayDataSheetDefinition.includes(assay_data_sheet_columns: [ :data_type ]).find(data_sheet_definition_id)
      klass = Class.new(ActiveRecord::Base) do
        self.table_name = sheet.table_name
        @sheet = sheet

        def self.detailed(params = nil)
          query = self.unscoped
            .select("#{self.table_name}.id")
            .select("#{self.table_name}.created_by")
            .select("#{self.table_name}.updated_by")
            .select("#{self.table_name}.created_at")
            .select("#{self.table_name}.updated_at")
            .select("#{self.table_name}.experiment_id")


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

      def self.create(params)
        params = params.as_json
        experiment_data_sheet = ExperimentDataSheet.includes(assay_data_sheet_definition: [ :assay_data_sheet_columns ]).find(params["experiment_data_sheet_id"])
        values = experiment_data_sheet.assay_data_sheet_definition.assay_data_sheet_columns.each_with_object({ experiment_id: experiment_data_sheet.experiment_id }) do |column, hash|
          hash[column.safe_name] = params[column.safe_name]
        end
        sheet_record_klass(experiment_data_sheet.assay_data_sheet_definition_id).create!(values)
      end

      def self.update(params)
        params = params.as_json
        experiment_data_sheet = ExperimentDataSheet.includes(assay_data_sheet_definition: [ :assay_data_sheet_columns ]).find(params["experiment_data_sheet_id"])
        record = sheet_record_klass(experiment_data_sheet.assay_data_sheet_definition_id).find(params["id"])
        values = experiment_data_sheet.assay_data_sheet_definition.assay_data_sheet_columns.each_with_object({}) do |column, hash|
          hash[column.safe_name] = params[column.safe_name]
        end
        record.update!(values)
        record
      end

      def self.definition_properties(**args)
        assay_data_sheet_definition_id = nil
        begin
          assay_data_sheet_definition_id = Grit::Assays::ExperimentDataSheet.find(args[:experiment_data_sheet_id]).assay_data_sheet_definition_id unless args[:experiment_data_sheet_id].nil?
        rescue
          assay_data_sheet_definition_id = Grit::Assays::AssayDataSheetDefinition.find(args[:experiment_data_sheet_id]).id unless args[:experiment_data_sheet_id].nil?
        rescue
          raise "Could not resolve data sheet definition from id: #{args[:experiment_data_sheet_id]}"
        end

        AssayDataSheetColumn.where(assay_data_sheet_definition_id: assay_data_sheet_definition_id).order("sort ASC NULLS LAST").map do |definition_column|
          property = {
            name: definition_column.safe_name,
            display_name: definition_column.name,
            description: definition_column.description,
            type: definition_column.data_type.is_entity ? "entity" : definition_column.data_type.name,
            required: definition_column.required,
            unique: false,
            entity: definition_column.data_type.entity_definition
          }
          property
        end
      end

      def self.entity_properties(**args)
        [ *self.db_properties, *self.definition_properties(**args) ]
      end

      def self.entity_fields(**args)
        self.entity_fields_from_properties(self.entity_properties(**args))
      end

      def self.entity_columns(**args)
        self.entity_columns_from_properties(self.entity_properties(**args))
      end

      def self.by_experiment_data_sheet(params)
        raise "No experiment_data_sheet_id specified" if params["experiment_data_sheet_id"].nil?

        experiment_data_sheet = Grit::Assays::ExperimentDataSheet.find(params["experiment_data_sheet_id"])
        sheet_record_klass(experiment_data_sheet.assay_data_sheet_definition_id).detailed(params).where(experiment_id: experiment_data_sheet.experiment_id)
      end

      def self.by_assay_data_sheet_definition(params)
        raise "No assay_data_sheet_definition_id specified" if params["assay_data_sheet_definition_id"].nil?
        klass = sheet_record_klass(params["assay_data_sheet_definition_id"])
        klass.detailed(params)
          .joins("JOIN grit_assays_experiments grit_assays_experiments__ on grit_assays_experiments__.id = #{klass.table_name}.experiment_id")
          .where("grit_assays_experiments__.publication_status_id" => Grit::Core::PublicationStatus.find_by(name: "Published").id)
      end

      def self.detailed(params = nil)
        params = params.as_json
        experiment_data_sheet = Grit::Assays::ExperimentDataSheet.find(params["experiment_data_sheet_id"])
        data_sheet_definition_id = params["data_sheet_definition_id"] || experiment_data_sheet.assay_data_sheet_definition_id
        raise "Could not find data sheet id" if data_sheet_definition_id.nil?
        sheet_record_klass(data_sheet_definition_id).detailed(params)
      end

      def self.by_load_set(params)
        raise "Load set id must be specified" if !params or !params[:load_set_id]
        record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: params[:load_set_id])
        data_sheet = Grit::Assays::ExperimentDataSheet.includes(:assay_data_sheet_definition).find(record_load_set.experiment_data_sheet_id)
        self.detailed(record_load_set.as_json).where("#{data_sheet.assay_data_sheet_definition.table_name}.id IN (SELECT record_id FROM grit_core_load_set_loaded_records WHERE grit_core_load_set_loaded_records.load_set_id = ?)", params[:load_set_id].to_i).order(:created_at)
      end
  end
end
