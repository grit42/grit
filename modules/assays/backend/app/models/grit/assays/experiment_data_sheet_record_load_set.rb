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
  class ExperimentDataSheetRecordLoadSet < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :load_set, class_name: "Grit::Core::LoadSet"
    belongs_to :assay_data_sheet_definition

    entity_crud_with create: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      read: [],
      update: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      destroy: [ "Administrator", "AssayAdministrator", "AssayUser" ]

    def self.entity_fields(**args)
      @entity_fields ||= self.entity_fields_from_properties(
        self.entity_properties.select { |p| [ "experiment_id", "assay_data_sheet_definition_id" ].include?(p[:name]) }
      )
    end
  end
end
