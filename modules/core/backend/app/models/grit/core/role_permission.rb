module Grit::Core
  class RolePermission < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :permission
    belongs_to :role

    entity_crud_with read: [ "read:users" ], write: [ "admin:users" ]

    def self.detailed(params = {})
      query = self.detailed_scope(params)
      query = query.where(role_id: params["role_id"]) if params["role_id"].present?
      query
    end
  end
end
