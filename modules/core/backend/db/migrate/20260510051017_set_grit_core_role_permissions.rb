class SetGritCoreRolePermissions < ActiveRecord::Migration[8.1]
  def up
    return unless Grit::Core::User.count.positive?

    if Grit::Core::Role.find_by(name: "User").blank?
      user_role_id = Grit::Core::Role.insert({ name: "User", description: "Can read data", system: true })[0]["id"]
      ActiveRecord::Base.connection.execute("INSERT INTO grit_core_user_roles(user_id, role_id) SELECT gcu.id, #{user_role_id} FROM grit_core_users gcu ON CONFLICT DO NOTHING")
    end

    administrator_role = Grit::Core::Role.find_by(name: "Administrator")
    if administrator_role.present?
      administrator_role.update_column(:system, true)
    end

    vocabulary_administrator_role = Grit::Core::Role.find_by(name: "VocabularyAdministrator")
    if vocabulary_administrator_role.present?
      read_collections_permission_id = Grit::Core::Permission.find_by(name: "read:collections")&.id || Grit::Core::Permission.insert({ name: "read:collections", description: "Can read collections (Vocabularies, Origins, Locations, Units, ...)" })[0]["id"]
      write_collections_permission_id = Grit::Core::Permission.find_by(name: "write:collections")&.id || Grit::Core::Permission.insert({ name: "write:collections", description: "Can write collections (Vocabularies items, Origins, Locations, Units, ...)", provides_permissions: [ read_collections_permission_id ] })[0]["id"]
      admin_collections_permission_id = Grit::Core::Permission.find_by(name: "admin:collections")&.id || Grit::Core::Permission.insert({ name: "admin:collections", description: "Can admin collections (Create and update Vocabularies)", provides_permissions: [ read_collections_permission_id, write_collections_permission_id ] })[0]["id"]

      Grit::Core::RolePermission.insert_all([ {
        role_id: vocabulary_administrator_role.id,
        permission_id: read_collections_permission_id
      }, {
        role_id: vocabulary_administrator_role.id,
        permission_id: write_collections_permission_id
      }, {
        role_id: vocabulary_administrator_role.id,
        permission_id: admin_collections_permission_id
      } ])
    end
  end

  def down
  end
end
