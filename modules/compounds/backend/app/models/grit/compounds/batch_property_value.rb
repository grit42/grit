#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-compounds.
#
# grit-compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-compounds. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit::Compounds
  class BatchPropertyValue < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :batch_property
    belongs_to :batch

    validate :property_value

    def property_value
      required = self.batch_property.required
      data_type = self.batch_property.data_type
      value_prop = data_type.is_entity ? "entity_id_value" : "#{data_type.name}_value"
      value = self[value_prop]

      errors.add(value_prop, "cannot be blank") if required && (value.nil? || value.blank?)

      if data_type.name == "integer" && !value.nil? && !value.blank? && value.to_i.bit_length > self.class.columns.find { |c| c.name == "integer_value" } &.sql_type_metadata.limit * 8
        errors.add(value_prop, "is out of range")
      elsif data_type.name == "float" && !value.nil? && !value.blank?
        errors.add(value_prop, "is out of range") if value.to_f.infinite?
        errors.add(value_prop, "is not a number") if value.to_f.nan?
      end
    end
  end
end
