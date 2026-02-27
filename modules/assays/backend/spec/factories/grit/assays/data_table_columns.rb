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
  factory :grit_assays_data_table_column, class: "Grit::Assays::DataTableColumn" do
    sequence(:name) { |n| "Table Column #{n}" }
    sequence(:safe_name) { |n| "tbl_col_#{n}" }
    association :data_table, factory: :grit_assays_data_table
    association :assay_data_sheet_column, factory: :grit_assays_assay_data_sheet_column
    source_type { "assay_data_sheet_column" }
    aggregation_method { "latest" }
    metadata_filters { {} }
    experiment_ids { [] }

    trait :from_assay_data_sheet_column do
      source_type { "assay_data_sheet_column" }
    end

    trait :from_entity_attribute do
      source_type { "entity_attribute" }
      assay_data_sheet_column { nil }
      sequence(:entity_attribute_name) { |n| "attribute_#{n}" }
    end
  end
end
