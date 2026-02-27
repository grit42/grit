# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/compounds.
#
# @grit42/compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.


FactoryBot.define do
  factory :grit_compounds_batch_property, class: "Grit::Compounds::BatchProperty" do
    sequence(:name) { |n| "BatchProp #{n}" }
    sequence(:safe_name) { |n| "bprop_#{n}" }
    description { "A batch property" }
    required { false }
    association :compound_type, factory: :grit_compounds_compound_type
    association :data_type, factory: :grit_core_data_type

    trait :required do
      required { true }
    end

    trait :optional do
      required { false }
    end

    trait :string_type do
      association :data_type, factory: [ :grit_core_data_type, :string ]
    end

    trait :integer_type do
      association :data_type, factory: [ :grit_core_data_type, :integer ]
    end

    trait :global do
      compound_type { nil }
    end
  end
end
