# frozen_string_literal: true

# Idempotently seeds the compounds permissions and roles defined in
# modules/compounds/backend/db/seeds.rb so specs can rely on them without
# depending on the seed file being run.
module CompoundsAccessControlSeeder
  module_function

  def seed!
    core = AccessControlSeeder.seed!
    write_compounds = Grit::Core::Permission.find_or_create_by!(name: "write:compounds") do |p|
      p.description = "Can create, modify and delete compounds and batches"
      p.provides_permissions = [ core[:permissions][:read_system].id, core[:permissions][:write_analysis].id ]
    end
    admin_compounds = Grit::Core::Permission.find_or_create_by!(name: "admin:compounds") do |p|
      p.description = "Can admin compounds and batches metadata"
      p.provides_permissions = [
        core[:permissions][:read_system].id,
        core[:permissions][:write_analysis].id,
        write_compounds.id
      ]
    end

    Grit::Core::RolePermission.find_or_create_by!(role: core[:roles][:write], permission: write_compounds)
    Grit::Core::RolePermission.find_or_create_by!(role: core[:roles][:manage], permission: write_compounds)
    Grit::Core::RolePermission.find_or_create_by!(role: core[:roles][:administrator], permission: admin_compounds)

    compound_user = Grit::Core::Role.find_or_create_by!(name: "CompoundUser") do |r|
      r.description = "Compound user"
      r.system = true
    end
    compound_administrator = Grit::Core::Role.find_or_create_by!(name: "CompoundAdministrator") do |r|
      r.description = "Compound administrator"
      r.system = true
    end
    Grit::Core::RolePermission.find_or_create_by!(role: compound_user, permission: write_compounds)
    Grit::Core::RolePermission.find_or_create_by!(role: compound_administrator, permission: admin_compounds)

    {
      core: core,
      permissions: { write_compounds: write_compounds, admin_compounds: admin_compounds },
      roles: { compound_user: compound_user, compound_administrator: compound_administrator }
    }
  end
end
