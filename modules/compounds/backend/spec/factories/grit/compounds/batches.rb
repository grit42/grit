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
  factory :grit_compounds_batch, class: "Grit::Compounds::Batch" do
    sequence(:name) { |n| "batch-#{n}" }
    sequence(:number) { |n| "BATCH#{n.to_s.rjust(7, '0')}" }
    description { "A test batch" }
    association :compound, factory: :grit_compounds_compound
    association :compound_type, factory: :grit_compounds_compound_type
    association :origin, factory: :grit_core_origin

    trait :screening do
      association :compound_type, factory: [ :grit_compounds_compound_type, :screening ]
    end
  end
end
