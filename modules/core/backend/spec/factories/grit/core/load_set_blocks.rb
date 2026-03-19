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
  factory :grit_core_load_set_block, class: "Grit::Core::LoadSetBlock" do
    sequence(:name) { |n| "load-set-block-#{n}" }
    separator { "," }
    headers { [ { "name" => "col_0", "display_name" => "Name" } ] }
    mappings { {} }
    has_errors { false }
    has_warnings { false }
    association :load_set, factory: :grit_core_load_set
    association :status, factory: [ :grit_core_load_set_status, :mapping ]

    trait :mapping do
      association :status, factory: [ :grit_core_load_set_status, :mapping ]
    end

    trait :succeeded do
      association :status, factory: [ :grit_core_load_set_status, :succeeded ]
      mappings { { "name" => { "header" => "col_0" } } }
    end

    trait :errored do
      association :status, factory: [ :grit_core_load_set_status, :errored ]
    end

    trait :with_errors do
      has_errors { true }
    end

    trait :with_warnings do
      has_warnings { true }
    end

    trait :tab_separated do
      separator { "\t" }
    end

    trait :semicolon_separated do
      separator { ";" }
    end
  end
end
