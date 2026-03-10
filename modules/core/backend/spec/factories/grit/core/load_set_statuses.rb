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
  factory :grit_core_load_set_status, class: "Grit::Core::LoadSetStatus" do
    sequence(:name) { |n| "Status_#{n}" }
    sequence(:description) { |n| "Description for status #{n}" }

    trait :created do
      initialize_with { Grit::Core::LoadSetStatus.find_or_create_by!(name: "Created") }
      name { "Created" }
      description { "Created" }
    end

    trait :initializing do
      initialize_with { Grit::Core::LoadSetStatus.find_or_create_by!(name: "Initializing") }
      name { "Initializing" }
      description { "Initializing" }
    end

    trait :mapping do
      initialize_with { Grit::Core::LoadSetStatus.find_or_create_by!(name: "Mapping") }
      name { "Mapping" }
      description { "The columns must be mapped to internal attributes" }
    end

    trait :mapped do
      initialize_with { Grit::Core::LoadSetStatus.find_or_create_by!(name: "Mapped") }
      name { "Mapped" }
      description { "" }
    end

    trait :validating do
      initialize_with { Grit::Core::LoadSetStatus.find_or_create_by!(name: "Validating") }
      name { "Validating" }
      description { "" }
    end

    trait :validated do
      initialize_with { Grit::Core::LoadSetStatus.find_or_create_by!(name: "Validated") }
      name { "Validated" }
      description { "" }
    end

    trait :invalidated do
      initialize_with { Grit::Core::LoadSetStatus.find_or_create_by!(name: "Invalidated") }
      name { "Invalidated" }
      description { "" }
    end

    trait :succeeded do
      initialize_with { Grit::Core::LoadSetStatus.find_or_create_by!(name: "Succeeded") }
      name { "Succeeded" }
      description { "The upload succeded" }
    end

    trait :errored do
      initialize_with { Grit::Core::LoadSetStatus.find_or_create_by!(name: "Errored") }
      name { "Errored" }
      description { "Errored" }
    end
  end
end
