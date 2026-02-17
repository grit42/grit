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

require "grit/core/entity_loader"

module Grit::Core
  class VocabularyItemLoader < Grit::Core::EntityLoader
    protected
    def self.block_fields(params)
      [ *super(params), *Grit::Core::VocabularyItemLoadSetBlock.entity_fields ]
    end

    def self.create(params)
      load_set = super

      Grit::Core::VocabularyItemLoadSetBlock.create!({
        load_set_block_id: load_set.load_set_blocks[0].id,
        vocabulary_id: params[:load_set_blocks]["0"]["vocabulary_id"]
      })

      load_set
    end

    def self.show(load_set)
      load_set_blocks = Grit::Core::LoadSetBlock
        .detailed
        .select("grit_core_vocabulary_item_load_set_blocks.vocabulary_id")
        .joins("JOIN grit_core_vocabulary_item_load_set_blocks on grit_core_vocabulary_item_load_set_blocks.load_set_block_id = grit_core_load_set_blocks.id")
        .where(load_set_id: load_set.id)
      return load_set.as_json if load_set_blocks.empty?
      { **load_set.as_json, load_set_blocks: load_set_blocks }
    end

    def self.destroy(load_set)
      Grit::Core::VocabularyItemLoadSetBlock.destroy_by(load_set_block_id: load_set.load_set_blocks.map { |b| b.id })
      super
    end

    def self.base_record_props(load_set_block)
      { vocabulary_id: Grit::Core::VocabularyItemLoadSetBlock.find_by(load_set_block_id: load_set_block.id).vocabulary_id }
    end

    def self.block_mapping_fields(load_set_block)
      vocabulary_item_load_set_block = Grit::Core::VocabularyItemLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      Grit::Core::VocabularyItem.entity_fields(vocabulary_id: vocabulary_item_load_set_block.vocabulary_id).filter { |f| ![ "vocabulary_id" ].include?(f[:name]) }
    end
  end
end
