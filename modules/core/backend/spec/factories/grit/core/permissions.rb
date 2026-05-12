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


FactoryBot.define do
  factory :grit_core_permission, class: "Grit::Core::Permission" do
    sequence(:name) { |n| "test:permission_#{n}" }
    sequence(:description) { |n| "Description for permission #{n}" }
    provides_permissions { [] }

    # Idempotent traits for the system permissions defined in db/seeds.rb.
    # Each trait yields the existing record when present so that factories
    # using these traits can be invoked from multiple specs without violating
    # the uniqueness constraint on `name`.
    trait :read_users do
      to_create { |instance| instance.save! unless instance.persisted? }
      initialize_with { AccessControlSeeder.permission(:read_users) }
    end

    trait :admin_users do
      to_create { |instance| instance.save! unless instance.persisted? }
      initialize_with { AccessControlSeeder.permission(:admin_users) }
    end

    trait :read_collections do
      to_create { |instance| instance.save! unless instance.persisted? }
      initialize_with { AccessControlSeeder.permission(:read_collections) }
    end

    trait :write_collections do
      to_create { |instance| instance.save! unless instance.persisted? }
      initialize_with { AccessControlSeeder.permission(:write_collections) }
    end

    trait :admin_collections do
      to_create { |instance| instance.save! unless instance.persisted? }
      initialize_with { AccessControlSeeder.permission(:admin_collections) }
    end
  end
end
