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
  class ExperimentDataModelMigrationController < ApplicationController
    def insert_missing_records
      query = <<-SQL
WITH
	MISSING_RECORD_VALUES AS (
		SELECT
			GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS.ID AS EXPERIMENT_DATA_SHEET_RECORD_ID,
			GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS.ID AS ASSAY_DATA_SHEET_COLUMN_ID
		FROM
			GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS
			JOIN GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS ON GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS.ID = GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS.EXPERIMENT_DATA_SHEET_ID
			JOIN GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS ON GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS.ASSAY_DATA_SHEET_DEFINITION_ID = GRIT_ASSAYS_EXPERIMENT_DATA_SHEETS.ASSAY_DATA_SHEET_DEFINITION_ID
			LEFT OUTER JOIN GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_VALUES ON GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_VALUES.ASSAY_DATA_SHEET_COLUMN_ID = GRIT_ASSAYS_ASSAY_DATA_SHEET_COLUMNS.ID
			AND GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_VALUES.EXPERIMENT_DATA_SHEET_RECORD_ID = GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_RECORDS.ID
		WHERE
			GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_VALUES.ID IS NULL
	)
INSERT INTO
	GRIT_ASSAYS_EXPERIMENT_DATA_SHEET_VALUES (
		EXPERIMENT_DATA_SHEET_RECORD_ID,
		ASSAY_DATA_SHEET_COLUMN_ID
	)
SELECT
	EXPERIMENT_DATA_SHEET_RECORD_ID,
	ASSAY_DATA_SHEET_COLUMN_ID
FROM
	MISSING_RECORD_VALUES;
      SQL
      ActiveRecord::Base.connection.execute(query)
    end

    def check_migration
      if ExperimentDataModelMigrationCheck.last&.status == "ongoing"
        render json: { success: false, errors: "Check is already in progress" }, status: :bad_request
        return
      end
      check = ExperimentDataModelMigrationCheck.create!(status: "ongoing")
      insert_missing_records
      errors = []
      ExperimentDataModelMigrationError.delete_all
      ExperimentDataSheetValue.all.each do |dsv|
        unless dsv.valid?
          error = {
            experiment_data_sheet_value_id: dsv.id,
            experiment_data_sheet_record_id: dsv.experiment_data_sheet_record_id,
            experiment_data_sheet_id: dsv.experiment_data_sheet_record.experiment_data_sheet_id,
            experiment_id: dsv.experiment_data_sheet_record.experiment_data_sheet.experiment_id,
            assay_data_sheet_column_id: dsv.assay_data_sheet_column_id,
            assay_data_sheet_definition_id: dsv.assay_data_sheet_column.assay_data_sheet_definition_id,
            migration_errors: dsv.assay_data_sheet_column.data_type.is_entity ? dsv.errors.as_json[:entity_id_value][0] : dsv.errors.as_json["#{dsv.assay_data_sheet_column.data_type.name}_value".to_sym][0]
          }
          errors.push error
        end
        if errors.length == 200
          ExperimentDataModelMigrationError.insert_all errors
          errors = []
        end
      end

      ExperimentDataModelMigrationError.insert_all errors if errors.length.positive?

      error_count = ExperimentDataModelMigrationError.count

      check.error_count = error_count
      check.status = "completed"
      check.save!

      render json: { success: error_count == 0, errors: error_count.positive? ? "#{error_count} error#{error_count > 1 ? "s have" : " has"} been found" : nil  }
    end

    def migrate
      ActiveRecord::Base.transaction do
        assay_models = AssayModel
          .includes(assay_data_sheet_definitions: [ assay_data_sheet_columns: [ :data_type ] ])
          .where(publication_status_id: Grit::Core::PublicationStatus.unscoped.select(:id).where(name: ["Published","Withdrawn"]))
        assay_models.each do |assay_model|
          assay_model.create_tables
          assay_model.assay_data_sheet_definitions.each do |assay_data_sheet_definition|
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
    end
  end
end
