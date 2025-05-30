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
  class CompoundLoadSet < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :load_set, class_name: "Grit::Core::LoadSet"
    belongs_to :compound_type, class_name: "Grit::Compounds::CompoundType"

    entity_crud_with read: [],
      create: [ "Administrator", "CompoundAdministrator", "CompoundUser" ],
      update: [ "Administrator", "CompoundAdministrator", "CompoundUser" ],
      destroy: [ "Administrator", "CompoundAdministrator", "CompoundUser" ]

    def self.entity_fields
      if @entity_fields.nil?
        fields_map = self.entity_fields_from_properties(
          self.entity_properties
            .select { |p| [ "compound_type_id", "structure_format" ].include?(p[:name]) }
        ).to_h { |item| [ item[:name], item.dup ] }
        fields_map["entity"][:disabled] = true unless fields_map["entity"].nil?
        fields_map["structure_format"] = {
          **fields_map["structure_format"],
          type: "select",
          select: {
            options: [ {
              label: "Molfile",
              value: "molfile"
            }, {
              label: "SMILES / No structure",
              value: "smiles"
            } ]
          }
        } unless fields_map["structure_format"].nil?
        @entity_fields = fields_map.values
      end
      @entity_fields
    end
  end
end
