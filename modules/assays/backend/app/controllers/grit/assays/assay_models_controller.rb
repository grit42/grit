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

    def update_metadata
      Grit::Assays::AssayModelMetadatum.where(assay_metadata_definition_id: params["removed"]).destroy_all
      Grit::Assays::AssayModelMetadatum.create(params["added"].map { |id| { assay_metadata_definition_id: id, assay_model_id: params["assay_model_id"] } })
      render json: { success: true }
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    private

    def permitted_params
      %i[ name description assay_type_id publication_status_id ]
    end
  end
end
