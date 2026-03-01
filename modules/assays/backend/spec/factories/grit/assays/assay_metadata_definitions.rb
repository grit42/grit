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
  factory :grit_assays_assay_metadata_definition, class: "Grit::Assays::AssayMetadataDefinition" do
    sequence(:name) { |n| "Metadata Definition #{n}" }
    sequence(:safe_name) { |n| "meta_def_#{n}" }
    description { "A test metadata definition" }
    association :vocabulary, factory: :grit_core_vocabulary

    trait :species do
      initialize_with do
        Grit::Assays::AssayMetadataDefinition.find_or_create_by!(name: "Species") do |md|
          md.safe_name = "species"
          md.description = "The species used in the experiment"
          md.vocabulary = Grit::Core::Vocabulary.first || FactoryBot.create(:grit_core_vocabulary)
        end
      end
      name { "Species" }
      safe_name { "species" }
      description { "The species used in the experiment" }
    end

    trait :tissue_type do
      initialize_with do
        Grit::Assays::AssayMetadataDefinition.find_or_create_by!(name: "Tissue Type") do |md|
          md.safe_name = "tissue_type"
          md.description = "The tissue type used in the experiment"
          md.vocabulary = Grit::Core::Vocabulary.first || FactoryBot.create(:grit_core_vocabulary)
        end
      end
      name { "Tissue Type" }
      safe_name { "tissue_type" }
      description { "The tissue type used in the experiment" }
    end
  end
end
