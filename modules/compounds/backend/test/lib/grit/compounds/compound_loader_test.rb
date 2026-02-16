require "test_helper"

module Grit::Compounds
  class CompoundLoaderTest < ActiveSupport::TestCase
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
  end
end
