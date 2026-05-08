class Grit::TestEntity < ApplicationRecord
  include Grit::Core::GritEntityRecord

  display_column "name"
  entity_crud_with read: [
      # "Administrator"
    ],
    create: [],
    update: [],
    destroy: []
end
