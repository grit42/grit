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
  factory :grit_core_data_type, class: "Grit::Core::DataType" do
    sequence(:name) { |n| "data_type_#{n}" }
    is_entity { false }

    trait :integer do
      name { "integer" }
      is_entity { false }
    end

    trait :string do
      name { "string" }
      is_entity { false }
    end

    trait :decimal do
      name { "decimal" }
      is_entity { false }
    end

    trait :boolean do
      name { "boolean" }
      is_entity { false }
    end

    trait :entity do
      sequence(:name) { |n| "entity_type_#{n}" }
      is_entity { true }
      table_name { "grit_core_users" }
    end
  end
end
