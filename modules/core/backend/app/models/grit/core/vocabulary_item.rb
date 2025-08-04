#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit::Core
  class VocabularyItem < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :vocabulary

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator",  "VocabularyAdministrator" ],
      update: [ "Administrator",  "VocabularyAdministrator" ],
      destroy: [ "Administrator",  "VocabularyAdministrator" ]

    def self.loader_find_by(prop, value, **args)
      find_by_props = { prop => value }
      if args[:options]
        find_by_props = { **find_by_props, **args[:options] }
      end
      find_by(find_by_props)
    end

    def self.loader_find_by!(prop, value, **args)
      find_by_props = { prop => value }
      if args[:options]
        find_by_props = { **find_by_props, **args[:options] }
      end
      find_by!(find_by_props)
    end
  end
end
