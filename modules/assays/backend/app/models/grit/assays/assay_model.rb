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
    belongs_to :publication_status, class_name: "Grit::Core::PublicationStatus"
    has_many :assays, dependent: :destroy
    has_many :assay_model_metadata, dependent: :destroy
    has_many :assay_data_sheet_definitions, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    before_update :maintain_data_sheet_tables

    def self.published(params)
      self.detailed(params).where("grit_core_publication_statuses__.name = 'Published'")
    end

    def maintain_data_sheet_tables # TODO: remove
      if publication_status.name == "Draft"
        drop_tables
      else
        create_tables
      end
    end

    def migrate
      ActiveRecord::Base.transaction do
        create_tables
        assay_data_sheet_definitions.each do |assay_data_sheet_definition|
          insert_statement = "INSERT INTO #{assay_data_sheet_definition.table_name}(id,created_by,updated_by,created_at,updated_at,experiment_id"
          results_query = Grit::Assays::ExperimentDataSheetRecord.unscoped
            .select("grit_assays_experiment_data_sheet_records.id")
            .select("grit_assays_experiment_data_sheet_records.created_by")
            .select("grit_assays_experiment_data_sheet_records.updated_by")
            .select("grit_assays_experiment_data_sheet_records.created_at")
            .select("grit_assays_experiment_data_sheet_records.updated_at")
            .select("grit_assays_experiment_data_sheets.experiment_id")
            .joins("JOIN grit_assays_experiment_data_sheets on grit_assays_experiment_data_sheets.id = grit_assays_experiment_data_sheet_records.experiment_data_sheet_id")

          assay_data_sheet_definition.assay_data_sheet_columns.each do |column|
            insert_statement += "," + column.safe_name
            results_query = results_query
              .joins("LEFT OUTER JOIN grit_assays_experiment_data_sheet_values dsv__#{column.safe_name} on dsv__#{column.safe_name}.assay_data_sheet_column_id = #{column.id} and dsv__#{column.safe_name}.experiment_data_sheet_record_id = grit_assays_experiment_data_sheet_records.id")

            if column.data_type.is_entity
              results_query = results_query.select("dsv__#{column.safe_name}.entity_id_value as #{column.safe_name}")
            else
              results_query = results_query.select("dsv__#{column.safe_name}.#{column.data_type.name}_value as #{column.safe_name}")
            end
          end

          insert_statement += ") #{results_query.to_sql}"
          ActiveRecord::Base.connection.execute(insert_statement)
        end
      end
    end

    def create_tables
      assay_data_sheet_definitions.each(&:create_table)
    end

    def drop_tables
      assay_data_sheet_definitions.each(&:drop_table)
    end
  end
end
