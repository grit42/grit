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
  class Vocabulary < ApplicationRecord
    include Grit::Core::GritEntityRecord

    after_save :maintain_data_type
    after_destroy :destroy_data_type

    has_many :vocabulary_items, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator",  "VocabularyAdministrator" ],
      update: [ "Administrator",  "VocabularyAdministrator" ],
      destroy: [ "Administrator",  "VocabularyAdministrator" ]

    def data_type
      @data_type ||= Grit::Core::DataType.unscoped.find_by("meta->'vocabulary_id' = ?", self.id)
    end

    def self.maintain_data_types
      self.all.each { |vocabulary| vocabulary.send(:maintain_data_type) }
    end

    private

    def maintain_data_type
      data_type = self.data_type
      data_type ||= Grit::Core::DataType.new({
        is_entity: true,
        table_name: Grit::Core::VocabularyItem.table_name,
        meta: {
          vocabulary_id: self.id
        }
      })

      data_type.name = self.name
      data_type.description = self.description

      data_type.save!
    end

    def destroy_data_type
      Grit::Core::DataType.destroy_by(name: self.name)
    end
  end
end
