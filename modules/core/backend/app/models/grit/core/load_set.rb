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

    def initialize_blocks
      load_set_blocks.each(&:initialize_data)
    end

    def rollback
      loader = Grit::Core::EntityLoader.loader(entity)
      created_status = Grit::Core::LoadSetStatus.find_by(name: "Created")
      load_set_blocks.each do |lsb|
        loader.rollback_block(lsb)
        lsb.status = created_status
        lsb.save!
      end
    end

    def cancel
      transaction do
        rollback
        destroy
      end
    end

    def succeeded_blocks?
      load_set_blocks.includes(:status).any? { |lsb| lsb.status.name == "Succeeded" }
    end

    private
      def check_status
        throw :abort if succeeded_blocks?
      end
  end
end
