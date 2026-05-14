# frozen_string_literal: true

# Idempotently seeds the assays permissions and roles defined in
# modules/assays/backend/db/seeds.rb so specs can rely on them without
# depending on the seed file being run.
module AssaysAccessControlSeeder
  module_function

  def seed!
    core = AccessControlSeeder.seed!
    write_assays = Grit::Core::Permission.find_or_create_by!(name: "write:assays") do |p|
      p.description = "Can create, modify and delete experiments"
      p.provides_permissions = [ core[:permissions][:read_system].id ]
    end
    admin_assays = Grit::Core::Permission.find_or_create_by!(name: "admin:assays") do |p|
      p.description = "Can admin assay models and metadata"
      p.provides_permissions = [ core[:permissions][:read_system].id, write_assays.id ]
    end

    Grit::Core::RolePermission.find_or_create_by!(role: core[:roles][:write], permission: write_assays)
    Grit::Core::RolePermission.find_or_create_by!(role: core[:roles][:manage], permission: admin_assays)
    Grit::Core::RolePermission.find_or_create_by!(role: core[:roles][:administrator], permission: admin_assays)

    { core: core, permissions: { write_assays: write_assays, admin_assays: admin_assays } }
  end
end
