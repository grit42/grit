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

RSpec.describe Grit::Compounds::Compound, type: :model do
  let(:origin) { create(:grit_core_origin) }
  let(:compound_type) { create(:grit_compounds_compound_type, :screening) }
  let(:compound) { create(:grit_compounds_compound, :with_molecule, origin: origin, compound_type: compound_type) }
  let(:synonym) { create(:grit_compounds_synonym, compound: compound, name: "wan") }

  before do
    admin = create(:grit_core_user, :admin, :with_admin_role)
    Grit::Core::UserSession.create(admin)
  end

  describe "associations" do
    it "belongs to compound_type" do
      expect(compound.compound_type).to eq(compound_type)
    end

    it "belongs to origin" do
      expect(compound.origin_id).to eq(origin.id)
    end

    it "has many synonyms" do
      synonym # trigger creation
      expect(compound.synonym.count).to be >= 1
      expect(compound.synonym.pluck(:name)).to include("wan")
    end

    it "has many batches" do
      create(:grit_compounds_batch, compound: compound, compound_type: compound_type, origin: origin)
      expect(compound.batch.count).to be >= 1
    end

    it "has one molecules_compound" do
      expect(compound.molecules_compound).not_to be_nil
    end
  end

  describe "no_synonyms_with_name validation" do
    it "rejects compound name that conflicts with existing synonym" do
      synonym # trigger creation
      new_compound = described_class.new(
        name: "wan",
        origin_id: origin.id,
        compound_type_id: compound_type.id
      )
      expect(new_compound).not_to be_valid
      expect(new_compound.errors[:name]).to include("has already been taken")
    end

    it "accepts compound with unique name" do
      new_compound = described_class.new(
        name: "unique_compound_name",
        origin_id: origin.id,
        compound_type_id: compound_type.id
      )
      expect(new_compound).to be_valid
    end
  end

  describe "#set_number callback" do
    it "auto-generates GRIT prefixed number on create" do
      new_compound = described_class.new(
        name: "test_compound",
        origin_id: origin.id,
        compound_type_id: compound_type.id
      )
      new_compound.save!

      expect(new_compound.number).not_to be_nil
      expect(new_compound.number).to start_with("GRIT")
      expect(new_compound.number).to match(/^GRIT\d{7}$/)
    end
  end

  describe ".create (custom create with molecule)" do
    it "creates compound without molecule" do
      result = described_class.create({
        "name" => "new_compound_no_mol",
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id
      })

      expect(result[:compound_id]).not_to be_nil
      expect(result[:molecule_id]).to be_nil
      expect(result[:molecules_compound_id]).to be_nil

      created_compound = described_class.find(result[:compound_id])
      expect(created_compound.name).to eq("new_compound_no_mol")
    end

    it "creates compound with new molecule from molfile" do
      molfile = Grit::Compounds::Molecule.molfile_from_smiles("CCCC")

      result = described_class.create({
        "name" => "new_compound_with_mol",
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id,
        "molecule" => molfile
      }, "molfile")

      expect(result[:compound_id]).not_to be_nil
      expect(result[:molecule_id]).not_to be_nil
      expect(result[:molecules_compound_id]).not_to be_nil

      created_compound = described_class.find(result[:compound_id])
      expect(created_compound.name).to eq("new_compound_with_mol")
    end

    it "creates compound with new molecule from smiles" do
      result = described_class.create({
        "name" => "new_compound_smiles",
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id,
        "molecule" => "CCCCC"
      }, "smiles")

      expect(result[:compound_id]).not_to be_nil
      expect(result[:molecule_id]).not_to be_nil
      expect(result[:molecules_compound_id]).not_to be_nil
    end

    it "reuses existing molecule if it already exists" do
      molfile = Grit::Compounds::Molecule.molfile_from_smiles("CCCCCC")
      existing_molecule = Grit::Compounds::Molecule.new(molfile: molfile)
      existing_molecule.save!

      result = described_class.create({
        "name" => "compound_reuse_mol",
        "origin_id" => origin.id,
        "compound_type_id" => compound_type.id,
        "molecule" => molfile
      }, "molfile")

      expect(result[:molecule_id]).to eq(existing_molecule.id)
    end
  end

  describe ".find_by_name_or_synonyms" do
    it "finds compound by name" do
      compound # trigger creation
      result = described_class.find_by_name_or_synonyms(compound.name)
      expect(result).to be_any
      expect(result.order(:id).first.id).to eq(compound.id)
    end
  end

  describe ".loader_find_by" do
    it "finds compound by name" do
      compound # trigger creation
      result = described_class.loader_find_by("name", compound.name)
      expect(result).not_to be_nil
      expect(result.id).to eq(compound.id)
    end

    it "returns nil for non-existent name" do
      result = described_class.loader_find_by("name", "non_existent_compound")
      expect(result).to be_nil
    end
  end

  describe ".loader_find_by!" do
    it "raises for non-existent name" do
      expect {
        described_class.loader_find_by!("name", "non_existent_compound")
      }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe ".detailed scope" do
    it "includes molecule data for compounds with structures" do
      result = described_class.detailed.where(id: compound.id).order(:id).first

      expect(result).not_to be_nil
      expect(result).to respond_to(:molecule)
      expect(result).to respond_to(:smiles)
      expect(result).to respond_to(:molweight)
      expect(result).to respond_to(:logp)
      expect(result).to respond_to(:molformula)
    end

    it "includes joined table data" do
      result = described_class.detailed.where(id: compound.id).order(:id).first

      expect(result).not_to be_nil
      expect(result).to respond_to(:origin_id__name)
      expect(result).to respond_to(:compound_type_id__name)
    end
  end
end
