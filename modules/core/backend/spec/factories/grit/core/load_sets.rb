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
  factory :grit_core_load_set, class: "Grit::Core::LoadSet" do
    sequence(:name) { |n| "load-set-#{n}" }
    entity { "TestEntity" }
    origin_id { create(:grit_core_origin).id }

    trait :succeeded do
      name { "test-entity-succeeded" }
    end

    trait :mapping do
      name { "test-entity-mapping" }
    end

    trait :with_mapping_block do
      after(:create) do |load_set|
        mapping_status = Grit::Core::LoadSetStatus.find_or_create_by!(name: "Mapping") do |s|
          s.description = "The columns must be mapped to internal attributes"
        end
        create(:grit_core_load_set_block,
          load_set: load_set,
          status: mapping_status,
          name: "#{load_set.name}-block"
        )
      end
    end

    trait :with_succeeded_block do
      after(:create) do |load_set|
        succeeded_status = Grit::Core::LoadSetStatus.find_or_create_by!(name: "Succeeded") do |s|
          s.description = "The upload succeded"
        end
        create(:grit_core_load_set_block,
          load_set: load_set,
          status: succeeded_status,
          name: "#{load_set.name}-block"
        )
      end
    end
  end
end
