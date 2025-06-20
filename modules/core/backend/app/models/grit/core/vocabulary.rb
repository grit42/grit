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

require "grit/core/entity_manager"
require "grit/core/user_defined_vocabularies"

module Grit::Core
  class Vocabulary < ApplicationRecord
    include Grit::Core::GritEntityRecord

    after_create :setup
    after_update :maintain_data_type
    after_destroy :teardown

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator" ],
      update: [ "Administrator" ],
      destroy: [ "Administrator" ]

    def item_model_class_name
      "Vocabulary#{self.id}"
    end

    def items_table_name
      "grit_core_user_defined_vocabularies_vocabulary_#{self.id}"
    end

    def setup
      Grit::Core::UserDefinedVocabularies.setup(self)
    end

    def maintain_data_type
      if self.saved_change_to_name?
        data_type = Grit::Core::DataType.find_by(name: self.name_before_last_save)
        data_type.name = self.name
        data_type.save!
      end
    end

    def teardown
      Grit::Core::UserDefinedVocabularies.teardown(self)
    end
  end
end
