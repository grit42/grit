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
  class AssaysController < ApplicationController
    include Grit::Core::GritEntityController

    def create
      ActiveRecord::Base.transaction do
        permitted_params = params.permit(self.permitted_params)
        @record = Grit::Assays::Assay.new(permitted_params)

        if !@record.save
          render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
          return
        end

        metadata_errors = {}

        Grit::Assays::AssayModelMetadatum.includes(:assay_metadata_definition).where(assay_model_id: @record.assay_model_id).each do |model_metadatum|
          if !params[model_metadatum.assay_metadata_definition.safe_name].nil? && !params[model_metadatum.assay_metadata_definition.safe_name].blank?
            metadatum = Grit::Assays::AssayMetadatum.new(
              assay_id: @record.id,
              assay_model_metadatum_id: model_metadatum.id,
              vocabulary_id: model_metadatum.assay_metadata_definition.vocabulary_id,
              vocabulary_item_id: params[model_metadatum.assay_metadata_definition.safe_name],
            )
            metadatum.save!
          else
            metadata_errors[model_metadatum.assay_metadata_definition.safe_name] = [ "can't be blank" ]
          end
        end

        if metadata_errors.keys.count.positive?
          render json: { success: false, errors: metadata_errors }, status: :unprocessable_entity
          return
        end

        scope = get_scope(params[:scope] || "detailed", params)
        @record = scope.find(@record.id)
        render json: { success: true, data: @record }, status: :created, location: @record
      end
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def update
      @record = Grit::Assays::Assay.find(params[:id])
      permitted_params = params.permit(self.permitted_params)

      if !@record.update(permitted_params)
        render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
        return
      end

      metadata_errors = {}

      Grit::Assays::AssayModelMetadatum.includes(:assay_metadata_definition).where(assay_model_id: @record.assay_model_id).each do |model_metadatum|
        metadatum = Grit::Assays::AssayMetadatum.find_by(assay_id: @record.id, assay_model_metadatum_id: model_metadatum.id)
        if metadatum && (!params[model_metadatum.assay_metadata_definition.safe_name].nil? && !params[model_metadatum.assay_metadata_definition.safe_name].blank?)
          metadatum.vocabulary_item_id = params[model_metadatum.assay_metadata_definition.safe_name]
          metadatum.save!
        elsif metadatum && (params[model_metadatum.assay_metadata_definition.safe_name].nil? || params[model_metadatum.assay_metadata_definition.safe_name].blank?)
          metadata_errors[model_metadatum.assay_metadata_definition.safe_name] = [ "can't be blank" ]
        elsif !metadatum && (!params[model_metadatum.assay_metadata_definition.safe_name].nil? && !params[model_metadatum.assay_metadata_definition.safe_name].blank?)
          metadatum = Grit::Assays::AssayMetadatum.new(
            assay_id: @record.id,
            assay_model_metadatum_id: model_metadatum.id,
            vocabulary_id: model_metadatum.assay_metadata_definition.vocabulary_id,
            vocabulary_item_id: params[model_metadatum.assay_metadata_definition.safe_name],
          )
          metadatum.save!
        end
      end

      if metadata_errors.keys.count.positive?
        render json: { success: false, errors: metadata_errors }, status: :unprocessable_entity
        return
      end

      scope = get_scope(params[:scope] || "detailed", params)
      @record = scope.find(params[:id])
      render json: { success: true, data: @record }
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end


    private

    def permitted_params
      %i[ name description assay_model_id publication_status_id ]
    end
  end
end
