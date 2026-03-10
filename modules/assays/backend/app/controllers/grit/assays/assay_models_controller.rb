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
  class AssayModelsController < ApplicationController
    include Grit::Core::GritEntityController

    def create
      AssayModel.transaction do
        permitted_params = params.permit(self.permitted_params)
        @record = AssayModel.new(permitted_params)
        @record.publication_status = Grit::Core::PublicationStatus.find_by(name: "Draft")

        if !@record.save
          render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
          return
        end

        render json: { success: true, data: @record }, status: :created, location: @record
      end
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def clone
      AssayModel.transaction do
        source_model = AssayModel.find(params[:assay_model_id])

        permitted_params = params.permit(self.permitted_params)
        @record = AssayModel.new(permitted_params)
        @record.publication_status = Grit::Core::PublicationStatus.find_by(name: "Draft")

        if !@record.save
          render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
          return
        end

        errors = []

        source_model.assay_data_sheet_definitions.each_with_index do |source_sheet, sheetIndex|
          begin
            sheet_attrs = source_sheet.attributes.slice("name", "description", "result", "sort")
            assay_data_sheet_definition = @record.assay_data_sheet_definitions.create(sheet_attrs)
            unless assay_data_sheet_definition.errors.blank?
              assay_data_sheet_definition.errors.each do |e|
                errors.push("Sheet #{sheetIndex} #{e.attribute}: #{e.message}")
              end
            else
              source_sheet.assay_data_sheet_columns.each_with_index do |source_column, columnIndex|
                column_attrs = source_column.attributes.slice("name", "safe_name", "description", "sort", "required", "data_type_id", "unit_id")
                assay_data_sheet_column = assay_data_sheet_definition.assay_data_sheet_columns.create(column_attrs)
                if assay_data_sheet_column.errors
                  assay_data_sheet_column.errors.each do |e|
                    errors.push("Sheet #{sheetIndex} column #{columnIndex} #{e.attribute}: #{e.message}")
                  end
                end
              end
            end
          rescue StandardError => e
            logger.warn e.to_s
            logger.warn e.backtrace.join("\n")
            errors["form"] ||= []
            errors["form"].push e.to_s
          end
        end

        source_model.assay_model_metadata.each_with_index do |source_metadata, metadatumIndex|
          begin
            assay_model_metadata = @record.assay_model_metadata.create(
              assay_metadata_definition_id: source_metadata.assay_metadata_definition_id
            )
            unless assay_model_metadata.errors.blank?
              assay_model_metadata.errors.each do |e|
                errors.push("Metadata #{metadatumIndex} #{e.attribute}: #{e.message}")
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

    def update_metadata
      Grit::Assays::AssayModelMetadatum.where(assay_metadata_definition_id: params["removed"], assay_model_id: params["assay_model_id"]).destroy_all
      Grit::Assays::AssayModelMetadatum.create(params["added"].map { |id| { assay_metadata_definition_id: id, assay_model_id: params["assay_model_id"] } })
      render json: { success: true }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def publish
      AssayModel.transaction do
        record = AssayModel.find(params[:assay_model_id])
        record.publication_status = Grit::Core::PublicationStatus.find_by(name: "Published")
        unless record.save
          render json: { success: false, errors: record.errors }, status: :unprocessable_entity
          return
        end
        record.create_tables
        render json: { success: true, data: record }
      rescue ActiveRecord::RecordNotFound => e
        logger.info e.to_s
        logger.info e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :not_found
        raise ActiveRecord::Rollback
      rescue StandardError => e
        logger.info e.to_s
        logger.info e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
        raise ActiveRecord::Rollback
      end
    end

    def draft
      AssayModel.transaction do
        record = AssayModel.find(params[:assay_model_id])
        record.publication_status = Grit::Core::PublicationStatus.find_by(name: "Draft")
        unless record.save
          render json: { success: false, errors: record.errors }, status: :unprocessable_entity
          return
        end
        record.drop_tables
        record.experiments.destroy_all
        record.assay_data_sheet_definitions.each { |dsd| dsd.assay_data_sheet_columns.each { |dsc| dsc.data_table_columns.destroy_all } }
        render json: { success: true, data: record }
      rescue ActiveRecord::RecordNotFound => e
        logger.info e.to_s
        logger.info e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :not_found
        raise ActiveRecord::Rollback
      rescue StandardError => e
        logger.info e.to_s
        logger.info e.backtrace.join("\n")
        render json: { success: false, errors: e.to_s }, status: :internal_server_error
        raise ActiveRecord::Rollback
      end
    end

    private

      def permitted_params
        %i[ name description assay_type_id ]
      end
  end
end
