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
  factory :grit_core_location, class: "Grit::Core::Location" do
    sequence(:name) { |n| "Location #{n}" }
    print_address { "123 Test Street, Test City 12345" }
    association :country, factory: :grit_core_country
    association :origin, factory: :grit_core_origin

    trait :north_pole do
      name { "Santa Claus' Shop" }
      print_address { "123 ELF ROAD, NORTH POLE 88888" }
    end
  end
end
