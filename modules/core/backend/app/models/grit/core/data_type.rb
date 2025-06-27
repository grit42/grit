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
  class DataType < ApplicationRecord
    include GritEntityRecord

    display_column "name"

    entity_crud_with read: []

    def self.entity_columns(**args)
      @entity_columns ||= self.entity_columns_from_properties(self.db_properties, [ "id", "created_at", "updated_at", "created_by", "updated_by", "meta", "table_name", "is_entity" ])
    end

    def entity_definition
      return nil if !self.is_entity
      options = {}
      foreign_key_model_name = self.model.name
      path = foreign_key_model_name.underscore.pluralize
      name = foreign_key_model_name.demodulize
      if self.model == Grit::Core::VocabularyItem
        options[:vocabulary_id] = self.meta["vocabulary_id"]
        path = "grit/core/vocabularies/#{self.meta["vocabulary_id"]}/vocabulary_items"
        name = self.name
      end

      {
        full_name: foreign_key_model_name,
        name: name,
        path: path,
        primary_key: "id",
        primary_key_type: "integer",
        options: options
      }
    end

    def model
      Grit::Core::EntityMapper.table_to_model_name(self.table_name).constantize
    end
  end
end
