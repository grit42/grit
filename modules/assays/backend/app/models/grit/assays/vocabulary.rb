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
  class Vocabulary < ApplicationRecord
    include Grit::Core::GritEntityRecord

    has_many :vocabulary_items, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator",  "VocabularyAdministrator" ],
      update: [ "Administrator",  "VocabularyAdministrator" ],
      destroy: [ "Administrator",  "VocabularyAdministrator" ]
  end
end
