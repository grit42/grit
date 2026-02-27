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
  factory :grit_core_user, class: "Grit::Core::User" do
    sequence(:login) { |n| "user_#{n}" }
    sequence(:name) { |n| "User #{n}" }
    sequence(:email) { |n| "user_#{n}@example.com" }
    active { true }
    association :origin, factory: :grit_core_origin

    # Authlogic tokens are auto-generated, but we set them explicitly
    # to avoid needing Authlogic active during factory creation.
    password_salt { Authlogic::Random.hex_token }
    crypted_password { Authlogic::CryptoProviders::SCrypt.encrypt("password" + password_salt) }
    persistence_token { Authlogic::Random.hex_token }
    single_access_token { Authlogic::Random.friendly_token }
    perishable_token { Authlogic::Random.friendly_token }
    login_count { 0 }
    failed_login_count { 0 }

    trait :admin do
      initialize_with do
        # Re-use existing admin if present (e.g. from seed data), otherwise build a new one.
        Grit::Core::User.find_by(login: "admin") || new(**attributes)
      end

      login { "admin" }
      name { "Administrator" }
      email { "admin@example.com" }
      active { true }
    end

    trait :inactive do
      active { false }
    end

    trait :with_admin_role do
      after(:create) do |user|
        admin_role = Grit::Core::Role.find_or_create_by!(name: "Administrator") do |role|
          role.description = "Administrator"
        end
        Grit::Core::UserRole.find_or_create_by!(user: user, role: admin_role)
      end
    end

    trait :with_location do
      association :location, factory: :grit_core_location
    end
  end
end
