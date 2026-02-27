# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/assays.
#
# @grit42/assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/assays. If not, see <https://www.gnu.org/licenses/>.


FactoryBot.define do
  factory :grit_assays_assay_data_sheet_column, class: "Grit::Assays::AssayDataSheetColumn" do
    sequence(:name) { |n| "Column #{n}" }
    sequence(:safe_name) { |n| "column_#{n}" }
    description { "A test data sheet column" }
    sequence(:sort) { |n| n }
    required { false }
    association :assay_data_sheet_definition, factory: :grit_assays_assay_data_sheet_definition
    association :data_type, factory: :grit_core_data_type

    trait :required do
      required { true }
    end

    trait :optional do
      required { false }
    end

    trait :integer_type do
      association :data_type, factory: [ :grit_core_data_type, :integer ]
    end

    trait :string_type do
      association :data_type, factory: [ :grit_core_data_type, :string ]
    end
  end
end
