Grit::Compounds::CompoundType.insert({ name: 'Small molecule', description: 'Small molecules', has_structure: true }) if Grit::Compounds::CompoundType.find_by(name: "Small molecule").nil?

Grit::Core::DataType.upsert({ name: "Grit::Compounds::Compound", description: "Compound", is_entity: true, table_name: "grit_compounds_compounds" }, unique_by: :name)
Grit::Core::DataType.upsert({ name: "Grit::Compounds::Batch", description: "Batch", is_entity: true, table_name: "grit_compounds_batches" }, unique_by: :name)

write_role_id = Grit::Core::Role.find_by(name: "Write").id
manage_role_id = Grit::Core::Role.find_by(name: "Manage").id
admin_role_id = Grit::Core::Role.find_by(name: "Administrator").id

read_system_permission_id = Grit::Core::Permission.find_by(name: "read:system").id
write_compounds_permission_id = Grit::Core::Permission.find_by(name: "write:compounds")&.id || Grit::Core::Permission.insert({ name: "write:compounds", description: "Can create, modify and delete compounds and batches", provides_permissions: [ read_system_permission_id ] })[0]["id"]
admin_compounds_permission_id = Grit::Core::Permission.find_by(name: "admin:compounds")&.id || Grit::Core::Permission.insert({ name: "admin:compounds", description: "Can admin compounds and batches metadata", provides_permissions: [ read_system_permission_id, write_compounds_permission_id ] })[0]["id"]

Grit::Core::RolePermission.insert({ role_id: write_role_id, permission_id: write_compounds_permission_id }) if Grit::Core::RolePermission.find_by(role_id: write_role_id, permission_id: write_compounds_permission_id).nil?
Grit::Core::RolePermission.insert({ role_id: manage_role_id, permission_id: write_compounds_permission_id }) if Grit::Core::RolePermission.find_by(role_id: manage_role_id, permission_id: write_compounds_permission_id).nil?
Grit::Core::RolePermission.insert({ role_id: admin_role_id, permission_id: admin_compounds_permission_id }) if Grit::Core::RolePermission.find_by(role_id: admin_role_id, permission_id: admin_compounds_permission_id).nil?
