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
  class ExperimentDataSheetRecord < ApplicationRecord # TODO: fix not use activerecord
    cattr_accessor :infer_rails_validation_from_db
    self.infer_rails_validation_from_db = false

    include Grit::Core::GritEntityRecord

    entity_crud_with read: [ "read:system" ], write: [ "write:assays" ]

    def self.sheet_record_klass(assay_data_sheet_definition_id)
      Grit::Assays::AssayDataSheetDefinition
        .includes(assay_data_sheet_columns: [ :data_type ])
        .find(assay_data_sheet_definition_id)
        .sheet_record_klass
    end

      def self.create(params)
        params = params.as_json
        assay_data_sheet_definition = AssayDataSheetDefinition.find(params["assay_data_sheet_definition_id"])
        values = assay_data_sheet_definition.assay_data_sheet_columns.each_with_object({ experiment_id: params["experiment_id"] }) do |column, hash|
          hash[column.safe_name] = params[column.safe_name]
        end
        sheet_record_klass(params["assay_data_sheet_definition_id"]).create!(values)
      end

      def self.update(params)
        params = params.as_json
        assay_data_sheet_definition = AssayDataSheetDefinition.find(params["assay_data_sheet_definition_id"])
        record = sheet_record_klass(params["assay_data_sheet_definition_id"]).find(params["id"])
        values = assay_data_sheet_definition.assay_data_sheet_columns.each_with_object({}) do |column, hash|
          hash[column.safe_name] = params[column.safe_name]
        end
        record.update!(values)
        record
      end

      def self.definition_properties(**args)
        assay_data_sheet_definition = Grit::Assays::AssayDataSheetDefinition.find(args[:assay_data_sheet_definition_id])

        AssayDataSheetColumn.where(assay_data_sheet_definition_id: assay_data_sheet_definition.id).order("sort ASC NULLS LAST").map do |definition_column|
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

      def self.entity_fields(**args)
        sheet_record_klass(args[:assay_data_sheet_definition_id]).entity_fields
      end

      def self.entity_columns(**args)
        sheet_record_klass(args[:assay_data_sheet_definition_id]).entity_columns
      end

      def self.by_experiment(params)
        raise "No experiment_id specified" if params["experiment_id"].nil?
        raise "No assay_data_sheet_definition_id specified" if params["assay_data_sheet_definition_id"].nil?

        sheet_record_klass(params["assay_data_sheet_definition_id"]).detailed(params).where(experiment_id: params[:experiment_id])
      end

      def self.by_assay_data_sheet_definition(params)
        raise "No assay_data_sheet_definition_id specified" if params["assay_data_sheet_definition_id"].nil?
        klass = sheet_record_klass(params["assay_data_sheet_definition_id"])
        query = klass.detailed(params)
          .with(experiment_with_metadata: Experiment.published)
          .joins("JOIN experiment_with_metadata grit_assays_experiments__ on grit_assays_experiments__.id = #{klass.table_name}.experiment_id")
          .select("grit_assays_experiments__.name as experiment_id__name")
        AssayMetadataDefinition.all.each do |md|
          query = query
            .select("grit_assays_experiments__.#{md.safe_name} as emd_#{md.safe_name}")
            .select("grit_assays_experiments__.#{md.safe_name}__name as emd_#{md.safe_name}__name")
        end
        query
      end

      def self.detailed(params = nil)
        params = params.as_json
        raise "No assay_data_sheet_definition_id specified" if params.nil? or params["assay_data_sheet_definition_id"].nil?
        sheet_record_klass(params["assay_data_sheet_definition_id"]).detailed(params)
      end

      def self.by_load_set_block(params)
        raise "Load set block id must be specified" if !params or !params[:load_set_block_id]
        assay_data_sheet_definition = Grit::Assays::ExperimentDataSheetRecordLoadSetBlock.find_by(load_set_block_id: params[:load_set_block_id]).assay_data_sheet_definition
        assay_data_sheet_definition.sheet_record_klass.detailed.where("#{assay_data_sheet_definition.table_name}.id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = ?)", params[:load_set_block_id].to_i).order(:created_at)
      end

  end
end
