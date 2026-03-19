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

RSpec.describe Grit::Compounds::SDF do
  describe ".properties" do
    it "parses properties from simple SDF file" do
      file = File.join(FILE_FIXTURE_PATH, "simple.sdf")
      properties = described_class.properties(File.open(file))

      expect(properties).to include("molecule")
      expect(properties).to include("SMILES")
      expect(properties).to include("MOLWEIGHT")
      expect(properties).to include("MOLFORMULA")
      expect(properties).to include("LOGP")
    end

    it "parses properties from multiple molecule SDF file" do
      file = File.join(FILE_FIXTURE_PATH, "multiple.sdf")
      properties = described_class.properties(File.open(file))

      expect(properties).to include("molecule")
      expect(properties).to include("SMILES")
      expect(properties).to include("MOLWEIGHT")
      expect(properties).to include("MOLFORMULA")
      expect(properties).to include("LOGP")
    end

    it "parses properties from SDF with custom properties" do
      file = File.join(FILE_FIXTURE_PATH, "with_properties.sdf")
      properties = described_class.properties(File.open(file))

      expect(properties).to include("molecule")
      expect(properties).to include("SMILES")
      expect(properties).to include("MOLWEIGHT")
      expect(properties).to include("MOLFORMULA")
      expect(properties).to include("LOGP")
      expect(properties).to include("CUSTOM_PROP")
    end

    it "handles empty SDF file" do
      empty_file = Tempfile.new([ "empty", ".sdf" ])
      begin
        properties = described_class.properties(File.open(empty_file.path))
        expect(properties).to eq([ "molecule" ])
      ensure
        empty_file.close
        empty_file.unlink
      end
    end

    it "handles SDF with no properties" do
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

        properties = described_class.properties(File.open(temp_file.path))
        expect(properties).to eq([ "molecule" ])
      ensure
        temp_file.close
        temp_file.unlink
      end
    end

    it "handles SDF with custom property names" do
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

        properties = described_class.properties(File.open(temp_file.path))
        expect(properties).to include("molecule")
        expect(properties).to include("CUSTOM_FIELD_1")
        expect(properties).to include("ANOTHER_FIELD")
      ensure
        temp_file.close
        temp_file.unlink
      end
    end
  end

  describe ".each_record" do
    it "parses single record from SDF file" do
      file = File.join(FILE_FIXTURE_PATH, "simple.sdf")
      records = []

      described_class.each_record(File.open(file)) do |record, counter|
        records << record
      end

      expect(records.length).to eq(1)
      record = records.first
      expect(record["molecule"]).to include("C   0  0  0  0  0  0  0  0  0  0  0  0")
      expect(record["molecule"]).to include("M  END")
      expect(record["SMILES"]).to eq("CCO")
      expect(record["MOLWEIGHT"]).to eq("46.07")
      expect(record["MOLFORMULA"]).to eq("C2H6O")
      expect(record["LOGP"]).to eq("0.32")
    end

    it "parses SDF file with Windows (CRLF) line endings" do
      file = File.join(FILE_FIXTURE_PATH, "simple_crlf.sdf")
      properties = described_class.properties(File.open(file))

      expect(properties).to include("molecule")
      expect(properties).to include("SMILES")
      expect(properties).to include("MOLWEIGHT")
      expect(properties).to include("MOLFORMULA")
      expect(properties).to include("LOGP")

      records = []
      described_class.each_record(File.open(file)) do |record, counter|
        records << record
      end

      expect(records.length).to eq(1)
      record = records.first
      expect(record["molecule"]).to include("C   0  0  0  0  0  0  0  0  0  0  0  0")
      expect(record["molecule"]).to include("M  END")
      expect(record["SMILES"]).to eq("CCO")
      expect(record["MOLWEIGHT"]).to eq("46.07")
      expect(record["MOLFORMULA"]).to eq("C2H6O")
      expect(record["LOGP"]).to eq("0.32")
    end

    it "parses multiple records from SDF file" do
      file = File.join(FILE_FIXTURE_PATH, "multiple.sdf")
      records = []

      described_class.each_record(File.open(file)) do |record, counter|
        records << record
      end

      expect(records.length).to eq(2)

      # First record (ethanol)
      record1 = records.first
      expect(record1["molecule"]).to include("M  END")
      expect(record1["SMILES"]).to eq("CCO")
      expect(record1["MOLWEIGHT"]).to eq("46.07")

      # Second record (propanol)
      record2 = records.second
      expect(record2["molecule"]).to include("M  END")
      expect(record2["SMILES"]).to eq("CCCO")
      expect(record2["MOLWEIGHT"]).to eq("60.10")
    end

    it "raises MalformedSdfFile for invalid SDF" do
      file = File.join(FILE_FIXTURE_PATH, "malformed.sdf")

      expect {
        described_class.each_record(File.open(file)) do |record, counter|
          # This should not be reached
        end
      }.to raise_error(Grit::Compounds::SDF::MalformedSdfFile)
    end

    it "handles SDF with no properties in records" do
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

        records = []
        described_class.each_record(File.open(temp_file.path)) do |record, counter|
          records << record
        end

        expect(records.length).to eq(1)
        expect(records.first["molecule"]).to include("M  END")
        expect(records.first["SMILES"]).to be_nil
      ensure
        temp_file.close
        temp_file.unlink
      end
    end

    it "handles SDF with custom property names in records" do
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

        records = []
        described_class.each_record(File.open(temp_file.path)) do |record, counter|
          records << record
        end

        expect(records.length).to eq(1)
        expect(records.first["CUSTOM_FIELD_1"]).to eq("custom_value_1")
        expect(records.first["ANOTHER_FIELD"]).to eq("another_value")
      ensure
        temp_file.close
        temp_file.unlink
      end
    end

    it "handles multi-line property values" do
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
        described_class.each_record(File.open(temp_file.path)) do |record, counter|
          records << record
        end

        expect(records.length).to eq(1)
        expect(records.first["MULTILINE_PROP"]).to eq("line one\nline two\nline three")
      ensure
        temp_file.close
        temp_file.unlink
      end
    end
  end
end
