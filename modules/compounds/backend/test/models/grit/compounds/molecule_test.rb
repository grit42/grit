require "test_helper"

module Grit::Compounds
  class MoleculeTest < ActiveSupport::TestCase
    setup do
      @molecule = grit_compounds_molecules(:ethanol)
      # Generate valid molfile from SMILES using RDKit
      @valid_molfile = Molecule.molfile_from_smiles("CCO")
    end

    # Test by_molfile class method
    test "by_molfile should find existing molecule by molfile" do
      # Create a molecule with valid molfile data
      new_molecule = Molecule.new(molfile: @valid_molfile)
      new_molecule.save!

      found = Molecule.by_molfile(@valid_molfile)
      assert_not_nil found
      assert_equal new_molecule.id, found.id
    end

    test "by_molfile should return nil for non-existent molfile" do
      # Use a valid but non-existent molecule (long chain)
      non_existent_molfile = Molecule.molfile_from_smiles("CCCCCCCCCCCCCCCCCCCC")

      found = Molecule.by_molfile(non_existent_molfile)
      assert_nil found
    end

    test "by_molfile should return nil for invalid molfile" do
      silence_stderr do
        assert_nil Molecule.by_molfile("invalid molfile data")
      end
    end

    # Test by_smiles class method
    test "by_smiles should find existing molecule by SMILES" do
      new_molecule = Molecule.new(molfile: @valid_molfile)
      new_molecule.save!

      # The valid_molfile represents ethanol (CCO)
      found = Molecule.by_smiles("CCO")
      assert_not_nil found
      assert_equal new_molecule.id, found.id
    end

    test "by_smiles should return nil for non-existent SMILES" do
      found = Molecule.by_smiles("CCCCCCCCCCCCCCCCCCCC") # Very long chain unlikely to exist
      assert_nil found
    end

    # Test molfile_from_smiles class method
    test "molfile_from_smiles should convert SMILES to molfile" do
      molfile = Molecule.molfile_from_smiles("CCO")
      assert_not_nil molfile
      assert_includes molfile, "V2000" # MOL file version string
      assert_includes molfile, "M  END" # MOL file terminator
    end

    # Test set_molid callback
    test "set_molid should auto-assign molid on save" do
      new_molecule = Molecule.new(molfile: @valid_molfile)
      assert_nil new_molecule.molid

      new_molecule.save!
      assert_not_nil new_molecule.molid
      assert new_molecule.molid > 0
    end

    test "set_molid should increment molid for new molecules" do
      max_molid = Molecule.maximum(:molid) || 0

      new_molecule = Molecule.new(molfile: @valid_molfile)
      new_molecule.save!

      assert_equal max_molid + 1, new_molecule.molid
    end

    test "set_molid should not change existing molid" do
      new_molecule = Molecule.new(molfile: @valid_molfile, molid: 999)
      new_molecule.save!

      assert_equal 999, new_molecule.molid
    end

    # Test associations through MoleculesCompound
    test "molecule should have compounds through molecules_compounds" do
      # ethanol molecule is linked to compounds via molecules_compounds fixture
      molecules_compounds = MoleculesCompound.where(molecule_id: @molecule.id)
      assert molecules_compounds.count >= 1, "Ethanol molecule should be linked to at least one compound"
    end
  end
end
