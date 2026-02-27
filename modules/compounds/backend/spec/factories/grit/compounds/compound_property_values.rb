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
  factory :grit_compounds_compound_property_value, class: "Grit::Compounds::CompoundPropertyValue" do
    association :compound_property, factory: :grit_compounds_compound_property
    association :compound, factory: :grit_compounds_compound
    text_value { "test value" }

    trait :with_string_value do
      string_value { "string test" }
      text_value { nil }
    end

    trait :with_integer_value do
      integer_value { 42 }
      text_value { nil }
    end

    trait :with_decimal_value do
      decimal_value { 3.14 }
      text_value { nil }
    end

    trait :with_boolean_value do
      boolean_value { true }
      text_value { nil }
    end
  end
end
