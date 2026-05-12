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
  factory :grit_core_role, class: "Grit::Core::Role" do
    sequence(:name) { |n| "Role_#{n}" }
    sequence(:description) { |n| "Description for role #{n}" }
    system { false }

    # Idempotent traits for the system roles defined in db/seeds.rb. Each
    # trait yields the existing record (with its seed permissions attached)
    # when present, so multiple specs can ask for the same role without
    # violating the uniqueness constraint on `name`.
    trait :user do
      to_create { |instance| instance.save! unless instance.persisted? }
      initialize_with { AccessControlSeeder.seed![:roles][:user] }
    end

    trait :manager do
      to_create { |instance| instance.save! unless instance.persisted? }
      initialize_with { AccessControlSeeder.seed![:roles][:manager] }
    end

    trait :administrator do
      to_create { |instance| instance.save! unless instance.persisted? }
      initialize_with { AccessControlSeeder.seed![:roles][:administrator] }
    end
  end
end
