module Grit::Core
  class Permission < ApplicationRecord
    include Grit::Core::GritEntityRecord

    entity_crud_with read: [ "read:system" ]

    has_many :role_permissions
    has_many :roles, through: :role_permissions
    has_many :user_roles, through: :roles
    has_many :users, through: :user_roles
  end
end
