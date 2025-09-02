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
  class DataTableColumnsController < ApplicationController
    include Grit::Core::GritEntityController

    def pivot_options
      values_query = AssayMetadatum.unscoped.from(
        AssayMetadatum.detailed.reselect(
          "grit_assays_assay_metadata.assay_model_metadatum_id",
          "grit_core_vocabulary_items__.id",
          "grit_core_vocabulary_items__.name"
        ).distinct(:assay_model_metadatum_id),
        :sub
      ).select(
        "assay_model_metadatum_id",
        "jsonb_agg(jsonb_build_object('value', id, 'label', name) ORDER BY name) as metadatum_values"
      ).group("assay_model_metadatum_id")

      query = AssayModelMetadatum.detailed()
        .joins("JOIN grit_assays_assay_data_sheet_definitions ON grit_assays_assay_data_sheet_definitions.assay_model_id = grit_assays_assay_models__.id")
        .joins("JOIN grit_assays_assay_data_sheet_columns ON grit_assays_assay_data_sheet_columns.assay_data_sheet_definition_id = grit_assays_assay_data_sheet_definitions.id")
        .joins("JOIN grit_assays_data_table_columns ON grit_assays_data_table_columns.assay_data_sheet_column_id = grit_assays_assay_data_sheet_columns.id")
        .joins("JOIN (#{values_query.to_sql}) metadata_values ON metadata_values.assay_model_metadatum_id = grit_assays_assay_model_metadata.id")
        .select("metadata_values.metadatum_values")
        .where("grit_assays_data_table_columns.id": params[:data_table_column_id])

      @record_count = query.count(:all)
      @records = query.all
      render json: { success: true, data: @records, cursor:@records.length, total: @record_count }
    end

    private

    def permitted_params
       [:data_table_id, :assay_data_sheet_column_id, :aggregation_method, :sort, :name, :safe_name, pivots: {}]
    end
  end
end
