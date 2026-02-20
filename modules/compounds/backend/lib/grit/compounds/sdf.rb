#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-compounds.
#
# grit-compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-compounds. If not, see <https://www.gnu.org/licenses/>.
#++

require "fileutils"

require "grit/core/entity_loader"

module Grit
  module Compounds
    class SDF
      class MalformedSdfFile < RuntimeError
      end

      PROP_DEF_REGEX = /^>\s+<(?<prop_name>\w+(\s+\w+)*)>$/

      def self.each_record(io)
        prop_names = Set["molecule"]
        record = {}
        record_lines = []
        mol_block = []
        counter = 0
        io.each_line(chomp: true) do |line|
          record_lines.push line and next if line != "$$$$"
          mol_end = record_lines.find_index("M  END")

          raise MalformedSdfFile.new "Malformed SDF file" if mol_end.nil?

          mol_block = record_lines[0..mol_end]

          record["molecule"] = mol_block.join("\n")

          prop_def = nil
          prop_name = nil
          prop_lines = []
          record_lines[mol_end+1..].each do |line|
            if line.strip == ""
              record[prop_name] = prop_lines.join("\n").strip
              prop_name = nil
              prop_lines = []
            elsif prop_def = PROP_DEF_REGEX.match(line)
              raise MalformedSdfFile.new "Malformed SDF file" unless prop_name.nil?
              prop_name = prop_def[:prop_name]
              prop_names.add(prop_name)
            else
              prop_lines.push line
            end
          end
          yield record, counter if block_given?
          record = {}
          record_lines = []
          counter = counter + 1
        end
      end

      def self.properties(io)
        prop_names = Set["molecule"]

        io.each_line(chomp: true) do |line|
          prop_def = PROP_DEF_REGEX.match(line)
          unless prop_def.nil?
            prop_name = prop_def[:prop_name]
            prop_names.add(prop_name)
          end
        end

        prop_names.to_a
      end
    end
  end
end
