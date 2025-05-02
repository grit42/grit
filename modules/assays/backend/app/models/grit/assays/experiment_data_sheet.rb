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
  class ExperimentDataSheet < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :assay_data_sheet_definition
    belongs_to :experiment
    has_many :experiment_data_sheet_records
    has_many :experiment_data_sheet_values
    has_many :experiment_data_sheet_record_load_sets, dependent: :destroy

    before_destroy :delete_dependents

    entity_crud_with create: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      read: [],
      update: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      destroy: [ "Administrator", "AssayAdministrator", "AssayUser" ]


    def self.by_load_set_id(params = nil)
      self.detailed(params)
        .joins("
          JOIN grit_assays_experiment_data_sheet_record_load_sets grit_assays_experiment_data_sheet_record_load_sets__ on
          grit_assays_experiment_data_sheet_record_load_sets__.experiment_data_sheet_id = grit_assays_experiment_data_sheets.id and
          grit_assays_experiment_data_sheet_record_load_sets__.load_set_id = #{params["load_set_id"]}
        ")
    end

    def delete_dependents
      experiment_data_sheets_records = Grit::Assays::ExperimentDataSheetRecord.unscoped.where(experiment_data_sheet_id: self.id).select(:id)
      Grit::Assays::ExperimentDataSheetValue.unscoped.where(experiment_data_sheet_record_id: experiment_data_sheets_records).delete_all
      experiment_data_sheets_records.delete_all
    end
  end
end
