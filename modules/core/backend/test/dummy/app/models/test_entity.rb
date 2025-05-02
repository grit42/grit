class TestEntity < ApplicationRecord
  include Grit::Core::GritEntityRecord

  display_column "name"
  entity_crud_with read: [],
    create: [],
    update: [],
    destroy: []
end
