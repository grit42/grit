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
# Used by factory traits like :with_user_role / :with_manager_role /
# :with_admin_role on the user factory.
module AccessControlSeeder
  PERMISSIONS = {
    read_users: {
      name: "read:users",
      description: "Can read user profiles",
      requires: []
    },
    admin_users: {
      name: "admin:users",
      description: "Can admin user profiles",
      requires: [ :read_users ]
    },
    read_collections: {
      name: "read:collections",
      description: "Can read collections (Vocabularies, Origins, Locations, Units, ...)",
      requires: []
    },
    write_collections: {
      name: "write:collections",
      description: "Can write collections (Vocabularies items, Origins, Locations, Units, ...)",
      requires: [ :read_collections ]
    },
    admin_collections: {
      name: "admin:collections",
      description: "Can admin collections (Create and update Vocabularies)",
      requires: [ :read_collections, :write_collections ]
    }
  }.freeze

  ROLES = {
    user: {
      name: "User",
      description: "Can read data",
      permissions: [ :read_users, :read_collections ]
    },
    manager: {
      name: "Manager",
      description: "Can read and write data",
      permissions: [ :read_users, :read_collections, :write_collections, :admin_collections ]
    },
    administrator: {
      name: "Administrator",
      description: "Can read and write data, and manage users",
      permissions: [ :read_users, :read_collections, :write_collections, :admin_collections, :admin_users ]
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
