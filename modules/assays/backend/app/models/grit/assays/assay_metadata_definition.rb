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
  class AssayMetadataDefinition < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :vocabulary
    has_many :assay_model_metadata, dependent: :destroy

    display_column "name"

    def safe_name
      self.name.downcase.underscore.gsub(/[^a-z0-9]/, "_").gsub(/^(\d)/, '__\1')
    end

    def self.by_assay_model(params)
      raise "No assay model provided" if params["assay_model_id"].nil?

      detailed(params)
      .joins("JOIN grit_assays_assay_model_metadata grit_assays_assay_model_metadata__ on grit_assays_assay_model_metadata__.assay_metadata_definition_id = grit_assays_assay_metadata_definitions.id and grit_assays_assay_model_metadata__.assay_model_id = #{params["assay_model_id"]}")
      .select("grit_assays_assay_model_metadata__.id as assay_model_metadatum_id")
    end

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]
  end
end
