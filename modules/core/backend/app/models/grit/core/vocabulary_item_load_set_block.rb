module Grit::Core
  class VocabularyItemLoadSetBlock < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :load_set_block
    belongs_to :vocabulary

    entity_crud_with read: [],
      create: [ "Administrator", "VocabularyAdministrator" ],
      update: [ "Administrator", "VocabularyAdministrator" ],
      destroy: [ "Administrator", "VocabularyAdministrator" ]

    def self.entity_fields
      @entity_fields ||= self.entity_fields_from_properties(self.entity_properties.select { |p| [ "vocabulary_id" ].include?(p[:name]) })
    end
  end
end
