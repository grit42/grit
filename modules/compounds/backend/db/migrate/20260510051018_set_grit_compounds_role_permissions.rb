class SetGritCompoundsRolePermissions < ActiveRecord::Migration[8.1]
  def up
    return unless Grit::Core::User.count.positive?

    compound_administrator_role = Grit::Core::Role.find_by(name: "CompoundAdministrator")
    compound_user_role = Grit::Core::Role.find_by(name: "CompoundUser")
    return unless compound_administrator_role.present? || compound_user_role.present?

    read_system_permission_id = Grit::Core::Permission.find_by(name: "read:system").id
    write_analysis_permission_id = Grit::Core::Permission.find_by(name: "write:analysis").id
    write_compounds_permission_id = Grit::Core::Permission.find_by(name: "write:compounds")&.id || Grit::Core::Permission.insert({ name: "write:compounds", description: "Can create, modify and delete compounds and batches", provides_permissions: [ read_system_permission_id, write_analysis_permission_id ] })[0]["id"]
    admin_compounds_permission_id = Grit::Core::Permission.find_by(name: "admin:compounds")&.id || Grit::Core::Permission.insert({ name: "admin:compounds", description: "Can admin compounds and batches metadata", provides_permissions: [ read_system_permission_id, write_analysis_permission_id, write_compounds_permission_id ] })[0]["id"]

    role_permissions = []
    if compound_administrator_role.present?
      role_permissions.push({
        role_id: compound_administrator_role.id,
        permission_id: admin_compounds_permission_id
      })
    end

    if compound_user_role.present?
      role_permissions.push({
        role_id: compound_user_role.id,
        permission_id: write_compounds_permission_id
      })
    end

    Grit::Core::RolePermission.insert_all(role_permissions, unique_by: [ :role_id, :permission_id ]) unless role_permissions.blank?
  end

  def down
  end
end
