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
  class AssayDataSheetDefinitionsController < ApplicationController
    include Grit::Core::GritEntityController

    def create_bulk
      params.permit!
      errors = []
      sheets = []
      AssayDataSheetDefinition.transaction do
        params["sheets"].each_with_index do |sheet, sheetIndex|
          begin
            columns = sheet["columns"]
            sheet.delete("columns")
            assay_data_sheet_definition = AssayDataSheetDefinition.create(sheet.slice("name", "description", "assay_model_id", "result", "sort" ))
            sheets.push(assay_data_sheet_definition)
            unless assay_data_sheet_definition.errors.blank?
              assay_data_sheet_definition.errors.each do |e|
                errors.push({message: e.message, path: ["sheets", sheetIndex, e.attribute]})
              end
            else
              columns.each_with_index do |column, columnIndex|
                assay_data_sheet_column = assay_data_sheet_definition.assay_data_sheet_columns.create(column.slice("name", "safe_name", "description", "sort", "required", "data_type_id", "unit_id"))
                if assay_data_sheet_column.errors
                  assay_data_sheet_column.errors.each do |e|
                    errors.push({message: e.message, path: ["sheets", sheetIndex, "columns", columnIndex, e.attribute]})
                  end
                end
              end
            end
          rescue StandardError => e
            logger.warn e.to_s;
            logger.warn e.backtrace.join("\n");
            errors.push({message: e.to_s, path: ["sheets", sheetIndex, "columns"]})
          end
        end
        unless errors.blank?
          render json: { success: false, errors: errors }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
        end
        render json: { success: true, data: sheets }
      end
    rescue StandardError => e
      logger.warn e.to_s;
      logger.warn e.backtrace.join("\n");
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

    def permitted_params
      %i[ name description assay_model_id result sort ]
    end
  end
end
