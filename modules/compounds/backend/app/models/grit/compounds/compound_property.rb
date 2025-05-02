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
  class CompoundProperty < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :compound_type, optional: true
    belongs_to :data_type, class_name: "Grit::Core::DataType"
    belongs_to :unit, class_name: "Grit::Core::Unit", optional: true

    display_column "name"


    entity_crud_with read: [],
      create: [ "Administrator", "CompoundAdministrator" ],
      update: [ "Administrator", "CompoundAdministrator" ],
      destroy: [ "Administrator", "CompoundAdministrator" ]

    validates :safe_name, uniqueness: true, length: { minimum: 3 }
    validates :safe_name, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :safe_name, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }
    validate :safe_name_not_conflict

    def safe_name_not_conflict
      return unless self.safe_name_changed?
      if Grit::Compounds::Compound.entity_properties.find { |p| p[:name] == self.safe_name }
        errors.add("safe_name", "cannot be used as a safe name")
      else
        begin
          # This is needed because of how active_support handles serialization as_json
          Grit::Compounds::Compound.send(self.safe_name)
        rescue NoMethodError => e
        rescue StandardError => e
          errors.add("safe_name", "cannot be used as a safe name")
        end
      end
    end

    before_destroy :check_compound_properties

    def check_compound_properties
      raise "Cannot delete CompoundProperty with existing CompoundPropertyValues" if Grit::Compounds::CompoundPropertyValue.unscoped.where(compound_property_id: self.id).count.positive?
    end
  end
end
