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
  factory :grit_compounds_molecule, class: "Grit::Compounds::Molecule" do
    sequence(:molid) { |n| n }
    sequence(:canonical_smiles) { |n| "C" * (n + 1) + "O" }
    molfile do
      <<~MOL

        Actelion Java MolfileCreator 1.0

          3  2  0  0  0  0  0  0  0  0999 V2000
           43.0667  -21.9375   -0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
           41.7676  -21.1875   -0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
           40.4686  -21.9375   -0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
          1  2  1  0  0  0  0
          2  3  1  0  0  0  0
        M  END
      MOL
    end

    trait :ethanol do
      canonical_smiles { "CCO" }
    end

    trait :propanol do
      canonical_smiles { "CCCO" }
    end
  end
end
