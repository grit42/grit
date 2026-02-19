require "test_helper"

module Grit::Compounds
  class CompoundTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @compound = grit_compounds_compounds(:one)
      @compound_type = grit_compounds_compound_types(:screening)
      @origin = grit_core_origins(:one)
      @synonym = grit_compounds_synonyms(:wan)
    end

    # Test associations
    test "compound should belong to compound_type" do
      assert_equal @compound_type, @compound.compound_type
    end

    test "compound should belong to origin" do
      assert_equal @origin.id, @compound.origin_id
    end

    test "compound should have many synonyms" do
      assert @compound.synonym.count >= 1
      assert_includes @compound.synonym.pluck(:name), "wan"
    end

    test "compound should have many batches" do
      assert @compound.batch.count >= 1
    end

    test "compound should have one molecules_compound" do
      # compound one is linked to ethanol molecule
      assert_not_nil @compound.molecules_compound
    end

    # Test no_synonyms_with_name validation
    test "compound name should not conflict with existing synonym" do
      new_compound = Compound.new(
        name: "wan", # This is a synonym name
        origin_id: @origin.id,
        compound_type_id: @compound_type.id
      )
      assert_not new_compound.valid?
      assert_includes new_compound.errors[:name], "has already been taken"
    end

    test "compound should be valid with unique name" do
      new_compound = Compound.new(
        name: "unique_compound_name",
        origin_id: @origin.id,
        compound_type_id: @compound_type.id
      )
      assert new_compound.valid?
    end

    # Test set_number callback
    test "set_number should auto-generate GRIT prefixed number on create" do
      new_compound = Compound.new(
        name: "test_compound",
        origin_id: @origin.id,
        compound_type_id: @compound_type.id
      )
      new_compound.save!

      assert_not_nil new_compound.number
      assert new_compound.number.start_with?("GRIT"), "Number should start with GRIT prefix"
      assert_match(/^GRIT\d{7}$/, new_compound.number, "Number should match GRIT followed by 7 digits")
    end

    # Test Compound.create class method (custom create with molecule)
    test "Compound.create should create compound without molecule" do
      result = Compound.create({
        "name" => "new_compound_no_mol",
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id
      })

      assert_not_nil result[:compound_id]
      assert_nil result[:molecule_id]
      assert_nil result[:molecules_compound_id]

      created_compound = Compound.find(result[:compound_id])
      assert_equal "new_compound_no_mol", created_compound.name
    end

    test "Compound.create should create compound with new molecule from molfile" do
      molfile = Molecule.molfile_from_smiles("CCCC") # butane

      result = Compound.create({
        "name" => "new_compound_with_mol",
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id,
        "molecule" => molfile
      }, "molfile")

      assert_not_nil result[:compound_id]
      assert_not_nil result[:molecule_id]
      assert_not_nil result[:molecules_compound_id]

      created_compound = Compound.find(result[:compound_id])
      assert_equal "new_compound_with_mol", created_compound.name
    end

    test "Compound.create should create compound with new molecule from smiles" do
      result = Compound.create({
        "name" => "new_compound_smiles",
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id,
        "molecule" => "CCCCC" # pentane
      }, "smiles")

      assert_not_nil result[:compound_id]
      assert_not_nil result[:molecule_id]
      assert_not_nil result[:molecules_compound_id]
    end

    test "Compound.create should reuse existing molecule if it already exists" do
      # First create a molecule
      molfile = Molecule.molfile_from_smiles("CCCCCC") # hexane
      existing_molecule = Molecule.new(molfile: molfile)
      existing_molecule.save!

      # Now create compound with same structure
      result = Compound.create({
        "name" => "compound_reuse_mol",
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id,
        "molecule" => molfile
      }, "molfile")

      assert_equal existing_molecule.id, result[:molecule_id]
    end

    # Test find_by_name_or_synonyms
    test "find_by_name_or_synonyms should find compound by name" do
      result = Compound.find_by_name_or_synonyms("one")
      assert result.any?
      assert_equal @compound.id, result.first.id
    end

    # Test loader_find_by
    test "loader_find_by should find compound by name" do
      result = Compound.loader_find_by("name", "one")
      assert_not_nil result
      assert_equal @compound.id, result.id
    end

    test "loader_find_by should return nil for non-existent name" do
      result = Compound.loader_find_by("name", "non_existent_compound")
      assert_nil result
    end

    # Test loader_find_by!
    test "loader_find_by! should raise for non-existent name" do
      assert_raises(ActiveRecord::RecordNotFound) do
        Compound.loader_find_by!("name", "non_existent_compound")
      end
    end

    # Test detailed scope
    test "detailed scope should include molecule data for compounds with structures" do
      result = Compound.detailed.where(id: @compound.id).first

      assert_not_nil result
      # Check that molecule-related fields are selected
      assert result.respond_to?(:molecule)
      assert result.respond_to?(:smiles)
      assert result.respond_to?(:molweight)
      assert result.respond_to?(:logp)
      assert result.respond_to?(:molformula)
    end

    test "detailed scope should include joined table data" do
      result = Compound.detailed.where(id: @compound.id).first

      assert_not_nil result
      assert result.respond_to?(:origin_id__name)
      assert result.respond_to?(:compound_type_id__name)
    end

  end
end
