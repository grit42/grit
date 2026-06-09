class Grit::TestEntity < ApplicationRecord
  include Grit::Core::GritEntityRecord

  display_column "name"
  entity_crud_with read: [ "read:system" ],
    write: [ "admin:system" ]
end
