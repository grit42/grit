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
  class CompoundType < ApplicationRecord
    include Grit::Core::GritEntityRecord

    display_column "name"


    entity_crud_with read: [],
      create: [ "Administrator", "CompoundAdministrator" ],
      update: [ "Administrator", "CompoundAdministrator" ],
      destroy: [ "Administrator", "CompoundAdministrator" ]

    before_destroy :check_compounds
    before_destroy :delete_dependents

    def check_compounds
      raise "Cannot delete CompoundType with existing Compounds" if Grit::Compounds::Compound.unscoped.where(compound_type_id: self.id).count.positive?
    end

    def delete_dependents
      Grit::Compounds::CompoundProperty.unscoped.where(compound_type_id: self.id).destroy_all
      Grit::Compounds::BatchProperty.unscoped.where(compound_type_id: self.id).destroy_all
    end
  end
end
