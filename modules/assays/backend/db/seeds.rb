write_role_id = Grit::Core::Role.find_by(name: "Write").id
manage_role_id = Grit::Core::Role.find_by(name: "Manage").id
admin_role_id = Grit::Core::Role.find_by(name: "Administrator").id

read_system_permission_id = Grit::Core::Permission.find_by(name: "read:system").id
write_assays_permission_id = Grit::Core::Permission.find_by(name: "write:assays")&.id || Grit::Core::Permission.insert({ name: "write:assays", description: "Can create, modify and delete experiments", provides_permissions: [ read_system_permission_id ] })[0]["id"]
admin_assays_permission_id = Grit::Core::Permission.find_by(name: "admin:assays")&.id || Grit::Core::Permission.insert({ name: "admin:assays", description: "Can admin assay models and metadata", provides_permissions: [ read_system_permission_id, write_assays_permission_id ] })[0]["id"]

Grit::Core::RolePermission.insert({ role_id: write_role_id, permission_id: write_assays_permission_id }) if Grit::Core::RolePermission.find_by(role_id: write_role_id, permission_id: write_assays_permission_id).nil?
Grit::Core::RolePermission.insert({ role_id: manage_role_id, permission_id: admin_assays_permission_id }) if Grit::Core::RolePermission.find_by(role_id: manage_role_id, permission_id: admin_assays_permission_id).nil?
Grit::Core::RolePermission.insert({ role_id: admin_role_id, permission_id: admin_assays_permission_id }) if Grit::Core::RolePermission.find_by(role_id: admin_role_id, permission_id: admin_assays_permission_id).nil?
