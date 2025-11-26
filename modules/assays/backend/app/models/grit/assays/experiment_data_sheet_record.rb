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

      def self.create(params)
        params = params.as_json
        ActiveRecord::Base.transaction do
          record = Grit::Assays::ExperimentDataSheetRecord.new({
            experiment_data_sheet_id: params["experiment_data_sheet_id"]
          })

          record.save!

          Grit::Assays::ExperimentDataSheet.includes(assay_data_sheet_definition: [ :assay_data_sheet_columns ])
            .find(params["experiment_data_sheet_id"]).assay_data_sheet_definition.assay_data_sheet_columns.each do |column|
            if !params[column.safe_name].nil? && !params[column.safe_name].blank?
              value = Grit::Assays::ExperimentDataSheetValue.new(
                experiment_data_sheet_record_id: record.id,
                assay_data_sheet_column_id: column.id,
              )
              if column.data_type.is_entity
                value.entity_id_value = params[column.safe_name]
              else
                value["#{column.data_type.name}_value"] = params[column.safe_name]
              end
              value.save!
            end
          end
          return record
        end
      end

      def self.update(params)
        ActiveRecord::Base.transaction do
          record = Grit::Assays::ExperimentDataSheetRecord.find(params["id"])

          Grit::Assays::ExperimentDataSheet.includes(assay_data_sheet_definition: [ :assay_data_sheet_columns ]).find(record.experiment_data_sheet_id).assay_data_sheet_definition.assay_data_sheet_columns.each do |column|
            value = Grit::Assays::ExperimentDataSheetValue.find_by(
              experiment_data_sheet_record_id: record.id,
              assay_data_sheet_column_id: column.id,
            )
            if value && (!params[column.safe_name].nil? && !params[column.safe_name].blank?)
              if column.data_type.is_entity
                value.entity_id_value = params[column.safe_name]
              else
                value["#{column.data_type.name}_value"] = params[column.safe_name]
              end
              value.save!
            elsif !value && (!params[column.safe_name].nil? && !params[column.safe_name].blank?)
              value = Grit::Assays::ExperimentDataSheetValue.new(
                experiment_data_sheet_record_id: record.id,
                assay_data_sheet_column_id: column.id,
              )
              if column.data_type.is_entity
                value.entity_id_value = params[column.safe_name]
              else
                value["#{column.data_type.name}_value"] = params[column.safe_name]
              end
              value.save!
            elsif value && (params[column.safe_name].nil? || params[column.safe_name].blank?)
              value.destroy
            end
          end
          return record
        end
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

      def self.for_sheets(assay_data_sheet_definition_id, sheet_ids)
        query = self.unscoped
          .select("grit_assays_experiment_data_sheet_records.id")
          .select("grit_assays_experiment_data_sheet_records.created_by")
          .select("grit_assays_experiment_data_sheet_records.updated_by")
          .select("grit_assays_experiment_data_sheet_records.created_at")
          .select("grit_assays_experiment_data_sheet_records.updated_at")
          .select("grit_assays_experiment_data_sheet_records.experiment_data_sheet_id")
          .where("grit_assays_experiment_data_sheet_records.experiment_data_sheet_id" => sheet_ids)

        Grit::Assays::AssayDataSheetColumn.where(assay_data_sheet_definition_id: assay_data_sheet_definition_id).all.each do |column|
          query = query
            .joins("LEFT OUTER JOIN grit_assays_experiment_data_sheet_values ev__#{column.safe_name} on ev__#{column.safe_name}.assay_data_sheet_column_id = #{column.id} and ev__#{column.safe_name}.experiment_data_sheet_record_id = grit_assays_experiment_data_sheet_records.id")

          if column.data_type.is_entity
            entity_klass = column.data_type.model
            query = query
              .joins("LEFT OUTER JOIN #{column.data_type.table_name} dt__#{column.data_type.id}__#{column.safe_name} on dt__#{column.data_type.id}__#{column.safe_name}.id = ev__#{column.safe_name}.entity_id_value")
              .select("ev__#{column.safe_name}.entity_id_value as #{column.safe_name}")
            for display_property in entity_klass.display_properties do
              query = query
                .select("dt__#{column.data_type.id}__#{column.safe_name}.#{display_property[:name]} as #{column.safe_name}__#{display_property[:name]}") unless entity_klass.display_properties.nil?
            end
          else
            query = query.select("ev__#{column.safe_name}.#{column.data_type.name}_value as #{column.safe_name}")
          end
        end
        query
      end

      def self.by_experiment_data_sheet(params)
        raise "No experiment_data_sheet_id specified" if params["experiment_data_sheet_id"].nil?

        sheet = Grit::Assays::ExperimentDataSheet.find(params["experiment_data_sheet_id"])
        self.for_sheets(sheet.assay_data_sheet_definition_id, sheet.id)
      end

      def self.by_assay_data_sheet_definition(params)
        raise "No assay_data_sheet_definition_id specified" if params["assay_data_sheet_definition_id"].nil?

        assay_data_sheet_definition = Grit::Assays::AssayDataSheetDefinition.find(params["assay_data_sheet_definition_id"])
        experiment_data_sheets = Grit::Assays::ExperimentDataSheet.unscoped.select("id").where(assay_data_sheet_definition_id: params["assay_data_sheet_definition_id"])
        self.for_sheets(assay_data_sheet_definition.id, experiment_data_sheets)
        .joins("LEFT OUTER JOIN grit_assays_experiment_data_sheets grit_assays_experiment_data_sheets__ on grit_assays_experiment_data_sheets__.id = grit_assays_experiment_data_sheet_records.experiment_data_sheet_id")
        .joins("LEFT OUTER JOIN grit_assays_experiments grit_assays_experiments__ on grit_assays_experiments__.id = grit_assays_experiment_data_sheets__.experiment_id")
        .select("grit_assays_experiments__.id as experiment_id")
        .select("grit_assays_experiments__.name as experiment_id__name")
        .where("grit_assays_experiments__.publication_status_id" => Grit::Core::PublicationStatus.find_by(name: "Published").id)
      end

      def self.detailed(params = nil)
        params = params.as_json
        sheet = Grit::Assays::ExperimentDataSheet.find(params["experiment_data_sheet_id"]) if !params["experiment_data_sheet_id"].nil?
        return self.for_sheets(sheet.assay_data_sheet_definition_id, sheet.id) unless sheet.nil?

        self.unscoped
          .select("grit_assays_experiment_data_sheet_records.id")
          .select("grit_assays_experiment_data_sheet_records.created_by")
          .select("grit_assays_experiment_data_sheet_records.updated_by")
          .select("grit_assays_experiment_data_sheet_records.created_at")
          .select("grit_assays_experiment_data_sheet_records.updated_at")
          .select("grit_assays_experiment_data_sheet_records.experiment_data_sheet_id")
      end

      def self.by_load_set(params)
        raise "Load set id must be specified" if !params or !params[:load_set_id]
        record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: params[:load_set_id])
        self.detailed(record_load_set.as_json).where("#{self.table_name}.id IN (SELECT record_id FROM grit_core_load_set_loaded_records WHERE grit_core_load_set_loaded_records.load_set_id = ?)", params[:load_set_id].to_i).order(:created_at)
      end
  end
end
