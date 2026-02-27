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
  factory :grit_assays_assay_type, class: "Grit::Assays::AssayType" do
    sequence(:name) { |n| "Assay Type #{n}" }
    description { "A test assay type" }

    trait :biochemical do
      name { "Biochemical" }
      description { "Biochemical assays measuring enzyme activity, binding, etc." }
    end

    trait :cellular do
      name { "Cellular" }
      description { "Cell-based assays measuring cellular response" }
    end

    trait :in_vivo do
      name { "In Vivo" }
      description { "In vivo animal studies" }
    end
  end
end
