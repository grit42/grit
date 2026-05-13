class SetGritAssaysRolePermissions < ActiveRecord::Migration[8.1]
  def up
    return unless Grit::Core::User.count.positive?

    assay_administrator_role = Grit::Core::Role.find_by(name: "AssayAdministrator")
    assay_user_role = Grit::Core::Role.find_by(name: "AssayUser")
    return unless assay_administrator_role.present? || assay_user_role.present?

    read_system_permission_id = Grit::Core::Permission.find_by(name: "read:system").id
    write_analysis_permission_id = Grit::Core::Permission.find_by(name: "write:analysis").id
    write_assays_permission_id = Grit::Core::Permission.find_by(name: "write:assays")&.id || Grit::Core::Permission.insert({ name: "write:assays", description: "Can create, modify and delete experiments", provides_permissions: [ read_system_permission_id, write_analysis_permission_id ] })[0]["id"]
    admin_assays_permission_id = Grit::Core::Permission.find_by(name: "admin:assays")&.id || Grit::Core::Permission.insert({ name: "admin:assays", description: "Can admin assay models and metadata", provides_permissions: [ read_system_permission_id, write_analysis_permission_id, write_assays_permission_id ] })[0]["id"]

    role_permissions = []
    if assay_administrator_role.present?
      role_permissions.push({
        role_id: assay_administrator_role.id,
        permission_id: admin_assays_permission_id
      })
    end

    if assay_user_role.present?
      role_permissions.push({
        role_id: assay_user_role.id,
        permission_id: write_assays_permission_id
      })
    end

    Grit::Core::RolePermission.insert_all(role_permissions, unique_by: [:role_id, :permission_id]) unless role_permissions.blank?
  end

  def down
  end
end
