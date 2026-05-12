class SetGritCoreRolePermissions < ActiveRecord::Migration[8.1]
  def up
    return unless Grit::Core::User.count.positive?

    if Grit::Core::Role.find_by(name: "Read").blank?
      read_role_id = Grit::Core::Role.find_by(name: "Read")&.id || Grit::Core::Role.insert({ name: "Read", description: "Read data", system: true })[0]["id"]
      ActiveRecord::Base.connection.execute("INSERT INTO grit_core_user_roles(user_id, role_id) SELECT gcu.id, #{read_role_id} FROM grit_core_users gcu ON CONFLICT DO NOTHING")
    end

    administrator_role = Grit::Core::Role.find_by(name: "Administrator")
    if administrator_role.present?
      administrator_role.update_column(:system, true)
    end

    vocabulary_administrator_role = Grit::Core::Role.find_by(name: "VocabularyAdministrator")
    if vocabulary_administrator_role.present?
      read_system_permission_id = Grit::Core::Permission.find_by(name: "read:system")&.id || Grit::Core::Permission.insert({ name: "read:system", description: "Read data" })[0]["id"]
      admin_vocabularies_permission_id = Grit::Core::Permission.find_by(name: "admin:vocabularies")&.id || Grit::Core::Permission.insert({ name: "admin:vocabularies", description: "Manage vocabularies", provides_permissions: [ read_system_permission_id ] })[0]["id"]

      Grit::Core::RolePermission.insert({
        role_id: vocabulary_administrator_role.id,
        permission_id: admin_vocabularies_permission_id
      })
    end
  end

  def down
  end
end
