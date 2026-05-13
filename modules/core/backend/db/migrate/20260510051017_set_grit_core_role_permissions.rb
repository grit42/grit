class SetGritCoreRolePermissions < ActiveRecord::Migration[8.1]
  def up
    return unless Grit::Core::User.count.positive?

    # Seed
    ## Roles
    read_role_id = Grit::Core::Role.find_by(name: "Read")&.id || Grit::Core::Role.insert({ name: "Read", description: "Read data", system: true })[0]["id"]
    analyse_role_id = Grit::Core::Role.find_by(name: "Analyse")&.id || Grit::Core::Role.insert({ name: "Analyse", description: "'Read' and use analysis features", system: true })[0]["id"]
    write_role_id = Grit::Core::Role.find_by(name: "Write")&.id || Grit::Core::Role.insert({ name: "Write", description: "'Analyse' and write data", system: true })[0]["id"]
    manage_role_id = Grit::Core::Role.find_by(name: "Manage")&.id || Grit::Core::Role.insert({ name: "Manage", description: "'Write' and manage models and controlled terminology", system: true })[0]["id"]
    admin_role_id = Grit::Core::Role.find_by(name: "Administrator")&.id || Grit::Core::Role.insert({ name: "Administrator", description: "System administrator", system: true })[0]["id"]

    ## Permissions
    read_system_permission_id = Grit::Core::Permission.find_by(name: "read:system")&.id || Grit::Core::Permission.insert({ name: "read:system", description: "Read data" })[0]["id"]
    write_analysis_permission_id = Grit::Core::Permission.find_by(name: "write:analysis")&.id || Grit::Core::Permission.insert({ name: "write:analysis", description: "Use analysis features", provides_permissions: [ read_system_permission_id ] })[0]["id"]
    admin_system_permission_id = Grit::Core::Permission.find_by(name: "admin:system")&.id || Grit::Core::Permission.insert({ name: "admin:system", description: "Manage system", provides_permissions: [ read_system_permission_id ] })[0]["id"]
    admin_users_permission_id = Grit::Core::Permission.find_by(name: "admin:users")&.id || Grit::Core::Permission.insert({ name: "admin:users", description: "Manage users", provides_permissions: [ read_system_permission_id ] })[0]["id"]
    admin_vocabularies_permission_id = Grit::Core::Permission.find_by(name: "admin:vocabularies")&.id || Grit::Core::Permission.insert({ name: "admin:vocabularies", description: "Manage vocabularies", provides_permissions: [ read_system_permission_id ] })[0]["id"]

    ## Role Permissions
    Grit::Core::RolePermission.upsert({ role_id: read_role_id, permission_id: read_system_permission_id }, unique_by: [:role_id, :permission_id])
    Grit::Core::RolePermission.upsert({ role_id: analyse_role_id, permission_id: write_analysis_permission_id }, unique_by: [:role_id, :permission_id])
    Grit::Core::RolePermission.upsert({ role_id: write_role_id, permission_id: write_analysis_permission_id }, unique_by: [:role_id, :permission_id])
    Grit::Core::RolePermission.upsert({ role_id: manage_role_id, permission_id: write_analysis_permission_id }, unique_by: [:role_id, :permission_id])
    Grit::Core::RolePermission.upsert({ role_id: manage_role_id, permission_id: admin_vocabularies_permission_id }, unique_by: [:role_id, :permission_id])
    Grit::Core::RolePermission.upsert({ role_id: manage_role_id, permission_id: write_analysis_permission_id }, unique_by: [:role_id, :permission_id])
    Grit::Core::RolePermission.upsert({ role_id: admin_role_id, permission_id: admin_vocabularies_permission_id }, unique_by: [:role_id, :permission_id])
    Grit::Core::RolePermission.upsert({ role_id: admin_role_id, permission_id: admin_system_permission_id }, unique_by: [:role_id, :permission_id])
    Grit::Core::RolePermission.upsert({ role_id: admin_role_id, permission_id: admin_users_permission_id }, unique_by: [:role_id, :permission_id])

    ActiveRecord::Base.connection.execute("INSERT INTO grit_core_user_roles(user_id, role_id) SELECT gcu.id, #{read_role_id} FROM grit_core_users gcu ON CONFLICT DO NOTHING")

    administrator_role = Grit::Core::Role.find_by(name: "Administrator")
    administrator_role.update_column(:system, true) unless administrator_role.system?

    vocabulary_administrator_role = Grit::Core::Role.find_by(name: "VocabularyAdministrator")
    if vocabulary_administrator_role.present?
      Grit::Core::RolePermission.insert({
        role_id: vocabulary_administrator_role.id,
        permission_id: admin_vocabularies_permission_id
      })
    end
  end

  def down
  end
end
