# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.

# Idempotently seeds the system roles and permissions defined in db/seeds.rb so
# specs can rely on them without depending on whether the seed file has run.
# Used by factory traits like :with_read_role / :with_manage_role /
# :with_administrator_role on the user factory.
module AccessControlSeeder
  PERMISSIONS = {
    read_system: {
      name: "read:system",
      description: "Read data",
      requires: []
    },
    write_analysis: {
      name: "write:analysis",
      description: "Use analysis features",
      requires: [ :read_system ]
    },
    admin_system: {
      name: "admin:system",
      description: "Manage system",
      requires: [ :read_system ]
    },
    admin_users: {
      name: "admin:users",
      description: "Manage users",
      requires: [ :read_system ]
    },
    admin_vocabularies: {
      name: "admin:vocabularies",
      description: "Manage vocabularies",
      requires: [ :read_system ]
    }
  }.freeze

  ROLES = {
    read: {
      name: "Read",
      description: "Read data",
      permissions: [ :read_system ]
    },
    analyse: {
      name: "Analyse",
      description: "'Read' and use analysis features",
      permissions: [ :write_analysis ]
    },
    write: {
      name: "Write",
      description: "'Analyse' and write data",
      permissions: [ :write_analysis ]
    },
    manage: {
      name: "Manage",
      description: "'Write' and manage models and controlled terminology",
      permissions: [ :write_analysis, :admin_vocabularies ]
    },
    administrator: {
      name: "Administrator",
      description: "System administrator",
      permissions: [ :admin_vocabularies, :admin_system, :admin_users ]
    }
  }.freeze

  module_function

  def seed!
    permissions = seed_permissions!
    roles = seed_roles!
    seed_role_permissions!(roles, permissions)
    { roles: roles, permissions: permissions }
  end

  def role(key)
    config = ROLES.fetch(key)
    Grit::Core::Role.find_or_create_by!(name: config[:name]) do |r|
      r.description = config[:description]
      r.system = true
    end
  end

  def permission(key)
    seed_permission!(key, {})
  end

  def seed_permissions!
    PERMISSIONS.each_with_object({}) do |(key, _), acc|
      acc[key] = seed_permission!(key, acc)
    end
  end

  def seed_permission!(key, already_seeded)
    config = PERMISSIONS.fetch(key)
    existing = Grit::Core::Permission.find_by(name: config[:name])
    return existing if existing

    require_ids = config[:requires].map do |dep_key|
      (already_seeded[dep_key] || seed_permission!(dep_key, already_seeded)).id
    end
    Grit::Core::Permission.create!(
      name: config[:name],
      description: config[:description],
      provides_permissions: require_ids
    )
  end

  def seed_roles!
    ROLES.transform_values do |config|
      Grit::Core::Role.find_or_create_by!(name: config[:name]) do |r|
        r.description = config[:description]
        r.system = true
      end
    end
  end

  def seed_role_permissions!(roles, permissions)
    ROLES.each do |key, config|
      role = roles[key]
      config[:permissions].each do |permission_key|
        permission = permissions[permission_key]
        Grit::Core::RolePermission.find_or_create_by!(role: role, permission: permission)
      end
    end
  end
end
