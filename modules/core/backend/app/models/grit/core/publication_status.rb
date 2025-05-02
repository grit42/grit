module Grit::Core
  class PublicationStatus < ApplicationRecord
    include Grit::Core::GritEntityRecord

    display_column "name"
    entity_crud_with read: []
  end
end
