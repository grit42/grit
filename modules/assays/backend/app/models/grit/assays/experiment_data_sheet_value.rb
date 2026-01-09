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
  class ExperimentDataSheetValue < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :experiment_data_sheet_record
    belongs_to :assay_data_sheet_column

    has_one :experiment_data_model_migration_error, required: false, dependent: :destroy

    entity_crud_with create: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      read: [],
      update: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      destroy: [ "Administrator", "AssayAdministrator", "AssayUser" ]

    validate :data_sheet_value

    def data_sheet_value
      required = self.assay_data_sheet_column.required
      data_type = self.assay_data_sheet_column.data_type
      value_prop = data_type.is_entity ? "entity_id_value" : "#{data_type.name}_value"
      value = self[value_prop]

      errors.add(value_prop, "cannot be blank") if required && (value.nil? || (data_type.name != "boolean" && value.blank?))

      if data_type.name == "integer" && !value.nil? && !value.blank? && value.to_i.bit_length > self.class.columns.find { |c| c.name == "integer_value" } &.sql_type_metadata.limit * 8
        errors.add(value_prop, "is out of range")
      elsif data_type.name == "float" && !value.nil? && !value.blank?
        errors.add(value_prop, "is out of range") if value.to_f.infinite?
        errors.add(value_prop, "is not a number") if value.to_f.nan?
      elsif !value.nil? && data_type.is_entity && data_type.model.find_by(id: value).nil?
        errors.add(value_prop, "cannot be blank, the entity may have been removed")
      end
    end
  end
end
