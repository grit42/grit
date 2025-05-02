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
  class AssayModel < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :assay_type
    has_many :assays, dependent: :destroy
    has_many :assay_model_metadata, dependent: :destroy
    has_many :assay_data_sheet_definitions, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]


    def self.update(params)
      params = params.as_json
      record = super.update(params.reject { |p| Grit::Assays::AssayModelsController.permitted_params })
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

    def self.published(params)
      self.detailed(params).where("grit_core_publication_statuses__.name = 'Published'")
    end
  end
end
