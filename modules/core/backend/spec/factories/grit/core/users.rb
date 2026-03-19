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

    # The User model has `before_validation :random_password, on: :create`
    # which overwrites any password set during factory build. We work around
    # this by setting the password in after(:create) via update (on: :update
    # doesn't trigger random_password).
    persistence_token { Authlogic::Random.hex_token }
    single_access_token { Authlogic::Random.friendly_token }
    perishable_token { Authlogic::Random.friendly_token }
    login_count { 0 }
    failed_login_count { 0 }

    after(:create) do |user|
      # Re-activate authlogic before the save. The User model has
      # `after_update :new_session` which calls UserSession.new(...),
      # and that requires an active Authlogic controller. In request
      # specs, the RequestStore middleware clears RequestStore (including
      # :authlogic_controller) after each HTTP request, so by the time
      # a lazy `let` triggers this factory, the controller may be gone.
      unless RequestStore.store[:authlogic_controller]
        RequestStore.store[:authlogic_controller] =
          Authlogic::TestCase::MockController.new
      end
      user.password = "password"
      user.password_confirmation = "password"
      user.save!
    end

    trait :admin do
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
