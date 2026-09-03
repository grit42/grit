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
    include Grit::Core::Controller::DangerousEdit

    def create_bulk
      params.permit!
      errors = []
      sheets = []
      AssayDataSheetDefinition.transaction do
        params["sheets"].each_with_index do |sheet, sheetIndex|
          begin
            columns = sheet["columns"]
            sheet.delete("columns")
            assay_data_sheet_definition = AssayDataSheetDefinition.create(sheet.slice("name", "description", "assay_model_id", "result", "sort"))
            sheets.push(assay_data_sheet_definition)
            unless assay_data_sheet_definition.errors.blank?
              assay_data_sheet_definition.errors.each do |e|
                errors.push({ message: e.message, path: [ "sheets", sheetIndex, e.attribute ] })
              end
            else
              columns.each_with_index do |column, columnIndex|
                assay_data_sheet_column = assay_data_sheet_definition.assay_data_sheet_columns.create(column.slice("name", "safe_name", "description", "sort", "required", "data_type_id", "unit_id"))
                if assay_data_sheet_column.errors
                  assay_data_sheet_column.errors.each do |e|
                    errors.push({ message: e.message, path: [ "sheets", sheetIndex, "columns", columnIndex, e.attribute ] })
                  end
                end
              end
            end
          rescue StandardError => e
            logger.warn e.to_s
            logger.warn e.backtrace.join("\n")
            errors.push({ message: e.to_s, path: [ "sheets", sheetIndex, "columns" ] })
          end
        end
        unless errors.blank?
          render json: { success: false, errors: errors }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
        end
        render json: { success: true, data: sheets }
      end
    rescue StandardError => e
      logger.warn e.to_s
      logger.warn e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def clone
      AssayDataSheetDefinition.transaction do
        source_sheet = AssayDataSheetDefinition.find(params[:id])

        permitted_params = params.permit(self.permitted_params)
        @record = AssayDataSheetDefinition.new(permitted_params)

        if !@record.save
          render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
          return
        end

        errors = []

        source_sheet.assay_data_sheet_columns.each_with_index do |source_column, columnIndex|
          begin
            column_attrs = source_column.attributes.slice("name", "safe_name", "description", "sort", "required", "data_type_id", "unit_id")
            assay_data_sheet_column = @record.assay_data_sheet_columns.create(column_attrs)
            if assay_data_sheet_column.errors
              assay_data_sheet_column.errors.each do |e|
                errors.push("Sheet #{sheetIndex} column #{columnIndex} #{e.attribute}: #{e.message}")
              end
            end
          rescue StandardError => e
            logger.warn e.to_s
            logger.warn e.backtrace.join("\n")
            errors["form"] ||= []
            errors["form"].push e.to_s
          end
        end

        unless errors.blank?
          render json: { success: false, errors: errors.join(". ") }, status: :unprocessable_entity
          raise ActiveRecord::Rollback
        end
        render json: { success: true, data: @record }, status: :created, location: @record
      end
    rescue ActiveRecord::RecordNotFound => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :not_found
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

    def permitted_params
      %i[ name description assay_model_id result sort ]
    end
  end
end
