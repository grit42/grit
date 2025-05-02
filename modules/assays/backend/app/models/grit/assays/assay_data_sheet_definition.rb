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
  class AssayDataSheetDefinition < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :assay_model
    has_many :assay_data_sheet_columns, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    after_create :add_to_existing_experiments
    before_destroy :destroy_from_existing_experiments

    def add_to_existing_experiments
      Grit::Assays::Experiment.detailed.joins("JOIN grit_assays_assay_models grit_assays_assay_models__ on grit_assays_assay_models__.id = grit_assays_assays__.assay_model_id and grit_assays_assay_models__.id = #{self.assay_model_id}").each do |experiment|
        Grit::Assays::ExperimentDataSheet.create!({ experiment_id: experiment.id, assay_data_sheet_definition_id: self.id })
      end
    end

    def destroy_from_existing_experiments
      Grit::Assays::ExperimentDataSheet.where(assay_data_sheet_definition_id: self.id).destroy_all
    end
  end
end
