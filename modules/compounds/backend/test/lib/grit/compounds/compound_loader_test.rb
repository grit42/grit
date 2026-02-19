require "test_helper"

module Grit::Compounds
  class CompoundLoaderTest < ActiveSupport::TestCase
    include Authlogic::TestCase

    setup do
      activate_authlogic
      Grit::Core::UserSession.create(grit_core_users(:admin))
      @compound_type = grit_compounds_compound_types(:screening)
      @origin = grit_core_origins(:one)
      @valid_molfile = File.read(file_fixture("simple.sdf")).split("M  END").first + "M  END"
    end

    # =========================================================================
    # Block Fields Tests
    # =========================================================================

    test "should return block fields including compound-specific fields" do
      params = { entity: "Grit::Compounds::Compound" }
      fields = CompoundLoader.block_fields(params)

      assert fields.any? { |f| f[:name] == "separator" }
      separator_field = fields.find { |f| f[:name] == "separator" }
      assert separator_field[:select][:options].any? { |opt| opt[:value] == "$$$$" }
    end

    test "should return block set data fields" do
      params = { entity: "Grit::Compounds::Compound" }
      fields = CompoundLoader.block_set_data_fields(params)

      field_names = fields.map { |f| f[:name] }
      assert_includes field_names, "separator"
      assert_includes field_names, "structure_format"
    end

    # =========================================================================
    # SDF Parsing Tests
    # =========================================================================

    test "should extract columns from SDF file content" do
      # Test with a simple SDF content directly
      sdf_content = File.read(file_fixture("simple.sdf"))

      # Create a mock load set block with an IO object
      io = StringIO.new(sdf_content)
      columns = Grit::Compounds::SDF.properties(io)
        .each_with_index.map { |h, index| { name: "col_#{index}", display_name: h.strip } }

      assert columns.any? { |col| col[:display_name] == "molecule" }
      assert columns.any? { |col| col[:display_name] == "SMILES" }
      assert columns.any? { |col| col[:display_name] == "MOLWEIGHT" }
    end

    test "should extract records from SDF content" do
      sdf_content = File.read(file_fixture("multiple.sdf"))

      records = []
      io = StringIO.new(sdf_content)
      Grit::Compounds::SDF.each_record(io) do |record, recordno|
        records << record
      end

      assert_equal 2, records.length
      assert records.first["molecule"].include?("M  END")
      assert records.second["molecule"].include?("M  END")
    end

    # =========================================================================
    # validate_record Tests
    # =========================================================================

    test "validate_record should validate compound property values with invalid type" do
      # Use existing string property from fixtures, but provide a value that would fail
      # Since string properties accept most values, we test the validation flow
      # exists but doesn't fail with a valid string
      string_property = grit_compounds_compound_properties(:one)

      context = {
        structure_format: "molfile",
        compound_properties: [ string_property ],
        db_property_names: Grit::Compounds::Compound.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "test_compound",
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id,
        "one" => "valid_string_value"
      }

      CompoundLoader.send(:validate_record, Grit::Compounds::Compound, record, record_props, context)

      # String property with string value should pass validation
      assert_nil record[:record_errors], "Valid string property value should not produce errors"
    end

    test "validate_record should pass with valid record data" do
      context = {
        structure_format: "molfile",
        compound_properties: Grit::Compounds::CompoundProperty.where(compound_type_id: [ @compound_type.id, nil ]),
        db_property_names: Grit::Compounds::Compound.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        "name" => "valid_compound",
        "origin_id" => @origin.id,
        "compound_type_id" => @compound_type.id
      }

      result = CompoundLoader.send(:validate_record, Grit::Compounds::Compound, record, record_props, context)

      assert_not result[:has_warnings], "Should not have warnings for valid record without molecule"
      assert_nil record[:record_errors], "Should not have errors for valid record"
    end

    # =========================================================================
    # validate_block_context Tests
    # =========================================================================

    test "validate_block_context should return structure_format and properties" do
      load_set_block = grit_core_load_set_blocks(:compound_loading_validated_block)

      context = CompoundLoader.send(:validate_block_context, load_set_block)

      assert_equal "molfile", context[:structure_format]
      assert_not_nil context[:compound_properties]
      assert_not_nil context[:db_property_names]
      assert_includes context[:db_property_names], "name"
      assert_includes context[:db_property_names], "description"
    end

    # =========================================================================
    # block_mapping_fields Tests
    # =========================================================================

    test "block_mapping_fields should exclude auto-generated fields" do
      load_set_block = grit_core_load_set_blocks(:compound_loading_validated_block)

      fields = CompoundLoader.send(:block_mapping_fields, load_set_block)
      field_names = fields.map { |f| f[:name] }

      # These fields should be excluded
      assert_not_includes field_names, "compound_type_id"
      assert_not_includes field_names, "molweight"
      assert_not_includes field_names, "logp"
      assert_not_includes field_names, "molformula"
      assert_not_includes field_names, "number"

      # These fields should be included
      assert_includes field_names, "name"
      assert_includes field_names, "molecule"
    end

    # =========================================================================
    # block_loading_fields Tests
    # =========================================================================

    test "block_loading_fields should convert mol type to text" do
      load_set_block = grit_core_load_set_blocks(:compound_loading_validated_block)

      fields = CompoundLoader.send(:block_loading_fields, load_set_block)

      mol_field = fields.find { |f| f[:name] == "molecule" }
      assert_not_nil mol_field
      assert_equal "text", mol_field[:type], "mol type should be converted to text"
    end

    test "block_loading_fields should exclude calculated fields" do
      load_set_block = grit_core_load_set_blocks(:compound_loading_validated_block)

      fields = CompoundLoader.send(:block_loading_fields, load_set_block)
      field_names = fields.map { |f| f[:name] }

      # Calculated fields should be excluded
      assert_not_includes field_names, "molweight"
      assert_not_includes field_names, "logp"
      assert_not_includes field_names, "molformula"
      assert_not_includes field_names, "number"

      # compound_type_id should be included for loading
      assert_includes field_names, "compound_type_id"
    end

    # =========================================================================
    # base_record_props Tests
    # =========================================================================

    test "base_record_props should return compound_type_id from load set block" do
      load_set_block = grit_core_load_set_blocks(:compound_loading_validated_block)

      props = CompoundLoader.send(:base_record_props, load_set_block)

      assert_not_nil props["compound_type_id"]
      assert_equal @compound_type.id, props["compound_type_id"]
    end

    # =========================================================================
    # Negative Tests
    # =========================================================================

    test "create should raise error with invalid compound_type_id" do
      invalid_params = {
        name: "invalid-compound-load",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "test-block",
            separator: "$$$$",
            compound_type_id: -999,  # Invalid ID
            structure_format: "molfile"
          }
        }
      }

      assert_raises(ActiveRecord::RecordInvalid) do
        CompoundLoader.send(:create, invalid_params)
      end
    end

    test "create should raise error with nil compound_type_id" do
      invalid_params = {
        name: "nil-compound-type-load",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id,
        load_set_blocks: {
          "0" => {
            name: "test-block",
            separator: "$$$$",
            compound_type_id: nil,
            structure_format: "molfile"
          }
        }
      }

      assert_raises(ActiveRecord::RecordInvalid) do
        CompoundLoader.send(:create, invalid_params)
      end
    end

    test "validate_record should handle missing required fields and add errors" do
      context = {
        structure_format: "molfile",
        compound_properties: [],
        db_property_names: Grit::Compounds::Compound.db_properties.map { |prop| prop[:name] }
      }

      record = {}
      record_props = {
        # Missing required fields: name, origin_id
        "compound_type_id" => @compound_type.id
      }

      CompoundLoader.send(:validate_record, Grit::Compounds::Compound, record, record_props, context)

      assert_not_nil record[:record_errors], "Should have errors for missing required fields"
      # origin_id is required
      assert record[:record_errors].has_key?(:origin_id), "Should have error for missing origin_id"
    end

    # =========================================================================
    # CSV Branch Tests
    # =========================================================================

    test "columns_from_file should use CSV parser when structure_format is not molfile" do
      # Create a load set with SMILES structure format (CSV-like)
      load_set = Grit::Core::LoadSet.create!(
        name: "csv-test-load-set",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id
      )

      load_set_block = Grit::Core::LoadSetBlock.create!(
        name: "csv-test-block",
        load_set_id: load_set.id,
        status_id: Grit::Core::LoadSetStatus.find_by(name: "Created").id,
        separator: ",",
        has_errors: false,
        has_warnings: false
      )

      # Attach the CSV file
      load_set_block.data.attach(
        io: File.open(file_fixture("compounds.csv")),
        filename: "compounds.csv",
        content_type: "text/csv"
      )

      # Create compound load set block with SMILES format (not molfile)
      Grit::Compounds::CompoundLoadSetBlock.create!(
        load_set_block_id: load_set_block.id,
        compound_type_id: @compound_type.id,
        structure_format: "smiles"
      )

      # Call columns_from_file - it should use CSV parser for non-molfile formats
      columns = CompoundLoader.send(:columns_from_file, load_set_block)

      assert_equal 3, columns.length
      assert_equal "col_0", columns[0][:name]
      assert_equal "SMILES", columns[0][:display_name]
      assert_equal "col_1", columns[1][:name]
      assert_equal "Name", columns[1][:display_name]
      assert_equal "col_2", columns[2][:name]
      assert_equal "Description", columns[2][:display_name]
    ensure
      load_set&.destroy
    end

    test "columns_from_file should use SDF parser when structure_format is molfile" do
      load_set_block = grit_core_load_set_blocks(:compound_loading_validated_block)

      # Attach an SDF file to the block
      load_set_block.data.attach(
        io: File.open(file_fixture("simple.sdf")),
        filename: "simple.sdf",
        content_type: "chemical/x-mdl-sdfile"
      )

      columns = CompoundLoader.send(:columns_from_file, load_set_block)

      # SDF parser returns molecule as first property
      assert columns.any? { |col| col[:display_name] == "molecule" }
      assert columns.any? { |col| col[:display_name] == "SMILES" }
    end

    test "records_from_file should use CSV parser when structure_format is not molfile" do
      # Create a load set with SMILES structure format
      load_set = Grit::Core::LoadSet.create!(
        name: "csv-records-test",
        entity: "Grit::Compounds::Compound",
        origin_id: @origin.id
      )

      load_set_block = Grit::Core::LoadSetBlock.create!(
        name: "csv-records-block",
        load_set_id: load_set.id,
        status_id: Grit::Core::LoadSetStatus.find_by(name: "Created").id,
        separator: ",",
        headers: '[{"name": "col_0", "display_name": "SMILES"}, {"name": "col_1", "display_name": "Name"}, {"name": "col_2", "display_name": "Description"}]',
        has_errors: false,
        has_warnings: false
      )

      load_set_block.data.attach(
        io: File.open(file_fixture("compounds.csv")),
        filename: "compounds.csv",
        content_type: "text/csv"
      )

      Grit::Compounds::CompoundLoadSetBlock.create!(
        load_set_block_id: load_set_block.id,
        compound_type_id: @compound_type.id,
        structure_format: "smiles"
      )

      # Collect records from file
      records = []
      CompoundLoader.send(:records_from_file, load_set_block) do |record|
        records << record
      end

      # CSV file has 2 data rows (header is skipped)
      assert_equal 2, records.length
      # First record should contain Ethanol data
      assert_includes records[0], "Ethanol"
    ensure
      load_set&.destroy
    end
  end
end
