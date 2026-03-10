require "test_helper"

module Grit::Compounds
  class SDFTest < ActiveSupport::TestCase
    test "should parse properties from simple SDF file" do
      file = file_fixture("simple.sdf")
      properties = SDF.properties(File.open(file))

      assert_includes properties, "molecule"
      assert_includes properties, "SMILES"
      assert_includes properties, "MOLWEIGHT"
      assert_includes properties, "MOLFORMULA"
      assert_includes properties, "LOGP"
    end

    test "should parse properties from multiple molecule SDF file" do
      file = file_fixture("multiple.sdf")
      properties = SDF.properties(File.open(file))

      assert_includes properties, "molecule"
      assert_includes properties, "SMILES"
      assert_includes properties, "MOLWEIGHT"
      assert_includes properties, "MOLFORMULA"
      assert_includes properties, "LOGP"
    end

    test "should parse properties from SDF with custom properties" do
      file = file_fixture("with_properties.sdf")
      properties = SDF.properties(File.open(file))

      assert_includes properties, "molecule"
      assert_includes properties, "SMILES"
      assert_includes properties, "MOLWEIGHT"
      assert_includes properties, "MOLFORMULA"
      assert_includes properties, "LOGP"
      assert_includes properties, "CUSTOM_PROP"
    end

    test "should handle empty SDF file" do
      empty_file = Tempfile.new([ "empty", ".sdf" ])
      begin
        properties = SDF.properties(File.open(empty_file.path))
        assert_equal [ "molecule" ], properties
      ensure
        empty_file.close
        empty_file.unlink
      end
    end

    test "should parse single record from SDF file" do
      file = file_fixture("simple.sdf")
      records = []

      SDF.each_record(File.open(file)) do |record, counter|
        records << record
      end

      assert_equal 1, records.length
      assert record = records.first
      assert record["molecule"].include?("C   0  0  0  0  0  0  0  0  0  0  0  0")
      assert record["molecule"].include?("M  END")
      assert_equal "CCO", record["SMILES"]
      assert_equal "46.07", record["MOLWEIGHT"]
      assert_equal "C2H6O", record["MOLFORMULA"]
      assert_equal "0.32", record["LOGP"]
    end

    test "should parse SDF file with Windows (CRLF) line endings" do
      file = file_fixture("simple_crlf.sdf")
      properties = SDF.properties(File.open(file))

      assert_includes properties, "molecule"
      assert_includes properties, "SMILES"
      assert_includes properties, "MOLWEIGHT"
      assert_includes properties, "MOLFORMULA"
      assert_includes properties, "LOGP"

      records = []
      SDF.each_record(File.open(file)) do |record, counter|
        records << record
      end

      assert_equal 1, records.length
      assert record = records.first
      assert record["molecule"].include?("C   0  0  0  0  0  0  0  0  0  0  0  0")
      assert record["molecule"].include?("M  END")
      assert_equal "CCO", record["SMILES"]
      assert_equal "46.07", record["MOLWEIGHT"]
      assert_equal "C2H6O", record["MOLFORMULA"]
      assert_equal "0.32", record["LOGP"]
    end

    test "should parse multiple records from SDF file" do
      file = file_fixture("multiple.sdf")
      records = []

      SDF.each_record(File.open(file)) do |record, counter|
        records << record
      end

      assert_equal 2, records.length

      # First record (ethanol)
      assert record1 = records.first
      assert record1["molecule"].include?("M  END")
      assert_equal "CCO", record1["SMILES"]
      assert_equal "46.07", record1["MOLWEIGHT"]

      # Second record (propanol)
      assert record2 = records.second
      assert record2["molecule"].include?("M  END")
      assert_equal "CCCO", record2["SMILES"]
      assert_equal "60.10", record2["MOLWEIGHT"]
    end

    test "should raise MalformedSdfFile for invalid SDF" do
      file = file_fixture("malformed.sdf")

      assert_raises SDF::MalformedSdfFile do
        SDF.each_record(File.open(file)) do |record, counter|
          # This should not be reached
        end
      end
    end

    test "should handle SDF with no properties" do
      sdf_content = <<~SDF
        simple_no_props.sdf

          3  2  0  0  0  0            999 V2000
            0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
            1.4000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
            2.1000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
          1  2  1  0  0  0  0
          2  3  2  0  0  0  0
        M  END
        $$$$
      SDF

      temp_file = Tempfile.new([ "no_props", ".sdf" ])
      begin
        temp_file.write(sdf_content)
        temp_file.rewind

        properties = SDF.properties(File.open(temp_file.path))
        assert_equal [ "molecule" ], properties

        records = []
        SDF.each_record(File.open(temp_file.path)) do |record, counter|
          records << record
        end

        assert_equal 1, records.length
        assert records.first["molecule"].include?("M  END")
        assert_nil records.first["SMILES"]
      ensure
        temp_file.close
        temp_file.unlink
      end
    end

    test "should handle SDF with custom property names" do
      sdf_content = <<~SDF
        custom_props.sdf

          3  2  0  0  0  0            999 V2000
            0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
            1.4000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
            2.1000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
          1  2  1  0  0  0  0
          2  3  2  0  0  0  0
        M  END
        > <CUSTOM_FIELD_1>
        custom_value_1

        > <ANOTHER_FIELD>
        another_value

        $$$$
      SDF

      temp_file = Tempfile.new([ "custom_props", ".sdf" ])
      begin
        temp_file.write(sdf_content)
        temp_file.rewind

        properties = SDF.properties(File.open(temp_file.path))
        assert_includes properties, "molecule"
        assert_includes properties, "CUSTOM_FIELD_1"
        assert_includes properties, "ANOTHER_FIELD"

        records = []
        SDF.each_record(File.open(temp_file.path)) do |record, counter|
          records << record
        end

        assert_equal 1, records.length
        assert_equal "custom_value_1", records.first["CUSTOM_FIELD_1"]
        assert_equal "another_value", records.first["ANOTHER_FIELD"]
      ensure
        temp_file.close
        temp_file.unlink
      end
    end

    test "should handle multi-line property values" do
      sdf_content = <<~SDF
        multiline_props.sdf

          3  2  0  0  0  0            999 V2000
            0.0000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
            1.4000    0.0000    0.0000 C   0  0  0  0  0  0  0  0  0  0  0  0
            2.1000    0.0000    0.0000 O   0  0  0  0  0  0  0  0  0  0  0  0
          1  2  1  0  0  0  0
          2  3  2  0  0  0  0
        M  END
        > <MULTILINE_PROP>
        line one
        line two
        line three

        $$$$
      SDF

      temp_file = Tempfile.new([ "multiline", ".sdf" ])
      begin
        temp_file.write(sdf_content)
        temp_file.rewind

        records = []
        SDF.each_record(File.open(temp_file.path)) do |record, counter|
          records << record
        end

        assert_equal 1, records.length
        assert_equal "line one\nline two\nline three", records.first["MULTILINE_PROP"]
      ensure
        temp_file.close
        temp_file.unlink
      end
    end
  end
end
