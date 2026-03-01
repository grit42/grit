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


require "rails_helper"

RSpec.describe Grit::Compounds::Molecule, type: :model do
  let(:molecule) { create(:grit_compounds_molecule, :ethanol) }
  let(:valid_molfile) { described_class.molfile_from_smiles("CCO") }

  describe ".by_molfile" do
    it "finds existing molecule by molfile" do
      new_molecule = described_class.new(molfile: valid_molfile)
      new_molecule.save!

      found = described_class.by_molfile(valid_molfile)
      expect(found).not_to be_nil
      expect(found.id).to eq(new_molecule.id)
    end

    it "returns nil for non-existent molfile" do
      non_existent_molfile = described_class.molfile_from_smiles("CCCCCCCCCCCCCCCCCCCC")

      found = described_class.by_molfile(non_existent_molfile)
      expect(found).to be_nil
    end

    it "returns nil for invalid molfile" do
      silence_stderr do
        expect(described_class.by_molfile("invalid molfile data")).to be_nil
      end
    end
  end

  describe ".by_smiles" do
    it "finds existing molecule by SMILES" do
      new_molecule = described_class.new(molfile: valid_molfile)
      new_molecule.save!

      found = described_class.by_smiles("CCO")
      expect(found).not_to be_nil
      expect(found.id).to eq(new_molecule.id)
    end

    it "returns nil for non-existent SMILES" do
      found = described_class.by_smiles("CCCCCCCCCCCCCCCCCCCC")
      expect(found).to be_nil
    end
  end

  describe ".molfile_from_smiles" do
    it "converts SMILES to molfile" do
      molfile = described_class.molfile_from_smiles("CCO")
      expect(molfile).not_to be_nil
      expect(molfile).to include("V2000")
      expect(molfile).to include("M  END")
    end
  end

  describe "#set_molid callback" do
    it "auto-assigns molid on save" do
      new_molecule = described_class.new(molfile: valid_molfile)
      expect(new_molecule.molid).to be_nil

      new_molecule.save!
      expect(new_molecule.molid).not_to be_nil
      expect(new_molecule.molid).to be > 0
    end

    it "increments molid for new molecules" do
      max_molid = described_class.maximum(:molid) || 0

      new_molecule = described_class.new(molfile: valid_molfile)
      new_molecule.save!

      expect(new_molecule.molid).to eq(max_molid + 1)
    end

    it "does not change existing molid" do
      new_molecule = described_class.new(molfile: valid_molfile, molid: 999)
      new_molecule.save!

      expect(new_molecule.molid).to eq(999)
    end
  end

  describe "associations" do
    it "can be linked to compounds through molecules_compounds" do
      compound = create(:grit_compounds_compound,
        name: "Ethanol Compound",
        compound_type: Grit::Compounds::CompoundType.first || create(:grit_compounds_compound_type)
      )
      Grit::Compounds::MoleculesCompound.create!(molecule: molecule, compound: compound)

      expect(Grit::Compounds::MoleculesCompound.where(molecule_id: molecule.id).count).to be >= 1
    end
  end

  private

  def silence_stderr
    original_stderr = $stderr.clone
    $stderr.reopen(File.new("/dev/null", "w"))
    yield
  ensure
    $stderr.reopen(original_stderr)
  end
end
