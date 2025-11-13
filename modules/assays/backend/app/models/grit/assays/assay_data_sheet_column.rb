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
  class AssayDataSheetColumn < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :assay_data_sheet_definition
    belongs_to :data_type, class_name: "Grit::Core::DataType"
    belongs_to :unit, class_name: "Grit::Core::Unit", optional: true
    has_many :experiment_data_sheet_values

    before_destroy :delete_dependents

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    validates :name, uniqueness: { scope: :assay_data_sheet_definition_id, message: "has already been taken in this data sheet" }, length: { minimum: 3 }
    validates :safe_name, uniqueness: { scope: :assay_data_sheet_definition_id, message: "has already been taken in this data sheet" }, length: { minimum: 3 }
    validates :name, uniqueness: { scope: [:assay_data_sheet_definition_id, :safe_name], message: "has already been taken as a safe name in this data sheet" }
    validates :safe_name, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :safe_name, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }
    validate :safe_name_not_conflict
    validate :name_not_safe_name

    def name_not_safe_name
      # Check for records within the same scope where field_b is the same as this record's field_a
      if Grit::Assays::AssayDataSheetColumn.where(assay_data_sheet_definition_id: self.assay_data_sheet_definition_id)
        .where(safe_name: name)
        .where.not(id: id) # Exclude the current record itself from the check (important for updates)
        .exists?
          errors.add(:name, "has allready been taken as a safe name in this data sheet")
      end
    end

    def safe_name_not_conflict
      return unless self.safe_name_changed?
      begin
        # This is needed because of how active_support handles serialization as_json
        Grit::Assays::AssayDataSheetColumn.send(self.safe_name)
      rescue NoMethodError
      rescue StandardError
        errors.add("safe_name", "cannot be used as a safe name")
      end
    end

    def self.detailed(params = {})
      self.detailed_scope(params)
        .joins("LEFT OUTER JOIN grit_assays_assay_models ON grit_assays_assay_models.id = grit_assays_assay_data_sheet_definitions__.assay_model_id")
        .select("grit_assays_assay_models.id as assay_model_id")
        .select("grit_assays_assay_models.name as assay_model_id__name")
    end

    def delete_dependents
      Grit::Assays::ExperimentDataSheetValue.unscoped.where(assay_data_sheet_column_id: self.id).delete_all
    end
  end
end
