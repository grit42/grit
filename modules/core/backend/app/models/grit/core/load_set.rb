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
  class LoadSet < ApplicationRecord
    include Grit::Core::GritEntityRecord

    has_many :load_set_blocks, dependent: :destroy

    before_destroy :check_status

    entity_crud_with create: [], read: [], update: [], destroy: []

    def self.by_entity(params)
      self.detailed.where([ "grit_core_load_sets.entity = ?", params[:entity] ])
    end

    def self.by_vocabulary(params = nil)
      self.detailed
        .distinct("grit_core_load_sets.id")
        .joins("JOIN grit_core_load_set_blocks grit_core_load_set_blocks__ on grit_core_load_set_blocks__.load_set_id = grit_core_load_sets.id")
        .joins("JOIN grit_core_vocabulary_item_load_set_blocks grit_core_vocabulary_item_load_set_blocks__ on grit_core_vocabulary_item_load_set_blocks__.load_set_block_id = grit_core_load_set_blocks__.id")
        .where(ActiveRecord::Base.sanitize_sql_array([ "grit_core_vocabulary_item_load_set_blocks__.vocabulary_id = ?", params[:vocabulary_id] ]))
    end

    private
      def check_status
        throw :abort if self.load_set_blocks.any? { |lsb| lsb.status.name == "Succeeded" }
      end
  end
end
