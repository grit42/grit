# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

# The shape of an implementation column declaration and its `problems`. How a
# table reports them is in table_definition_spec.rb.
RSpec.describe Grit::Core::Model::DynamicSchema::ImplementationColumn do
  describe ".coerce" do
    it "fills in what a Hash leaves out" do
      column = described_class.coerce(identifier: :owner_id, data_type_name: "bigint")

      expect(column).to have_attributes(
        identifier: "owner_id", data_type_name: "bigint", required: false, writable: false,
        default_hidden: false, foreign_key: nil, type: nil, presented_when: nil
      )
      expect(column.property_type).to eq("integer")
      expect(column.target_column).to eq("id")
    end

    it "passes an ImplementationColumn through" do
      column = described_class.new(identifier: "owner_id", data_type_name: "bigint")

      expect(described_class.coerce(column)).to be(column)
    end

    it "coerces the foreign key" do
      column = described_class.coerce(
        identifier: "owner_login", data_type_name: "varchar",
        foreign_key: { table_name: :grit_core_users, primary_key: :login }
      )

      expect(column.foreign_key).to eq(described_class::ForeignKey.new(table_name: "grit_core_users", primary_key: "login"))
      expect(column.target_column).to eq("login")
    end

    it "refuses a misspelt key" do
      expect { described_class.coerce(identifier: "owner_id", data_type_name: "bigint", requird: true) }
        .to raise_error(ArgumentError, /unknown keyword: :requird/)
    end

    it "refuses a misspelt foreign key key" do
      expect { described_class.coerce(identifier: "owner_id", data_type_name: "bigint", foreign_key: { table: "grit_core_users" }) }
        .to raise_error(ArgumentError, /unknown keyword: :table/)
    end
  end

  describe "#problems" do
    it "has none for a complete declaration" do
      column = described_class.new(identifier: "owner_id", data_type_name: "bigint", foreign_key: { table_name: "grit_core_users" })

      expect(column.problems).to eq([])
    end

    it "reports a missing identifier alone" do
      expect(described_class.new(data_type_name: "jsonb").problems).to eq([ "An implementation column is missing an identifier" ])
    end

    # The shape checks only run once the identifier is sound.
    it "reports a bad identifier before the shape" do
      expect(described_class.new(identifier: "Owner").problems.join).to match(/lowercase letters/)
      expect(described_class.new(identifier: "Owner").problems.join).not_to match(/data_type_name/)
    end

    it "reports every shape problem at once" do
      column = described_class.new(identifier: "owner_id", type: "entity", foreign_key: {})

      expect(column.problems).to contain_exactly(
        /missing a data_type_name/, /carries no entity definition/, /foreign key with no table_name/
      )
    end

    # `type:` is checked too: it names the grit type the UI renders.
    it "reports a type that is not a grit property type" do
      expect(described_class.new(identifier: "meta", data_type_name: "jsonb", type: "sting").problems)
        .to contain_exactly(/type "sting", which is not one of/)
      expect(described_class.new(identifier: "meta", data_type_name: "jsonb", type: "text").problems).to eq([])
    end

    # Anything else would reach the UI as a property type nothing renders.
    it "reports an SQL type that names no grit type" do
      expect(described_class.new(identifier: "meta", data_type_name: "jsonb").problems)
        .to contain_exactly(/data_type_name "jsonb", which is not one of .*; declare the grit property type with type:/)
    end

    it "reports an identifier no dynamic table can take" do
      max = Grit::Core::Model::DynamicSchema::ValidIdentifier::MAX_IDENTIFIER_LENGTH
      {
        "o" * (max + 1) => /is #{max + 1} bytes; at most #{max}/,
        "created_at" => /is a base column of every dynamic table/,
        "xmin" => /is a PostgreSQL system column name/,
        "owner__name" => /should not contain a double underscore/
      }.each do |identifier, problem|
        expect(described_class.new(identifier: identifier, data_type_name: "bigint").problems).to contain_exactly(problem), identifier
      end
    end
  end

  # The inverse of `DataType#sql_name`, plus catalog spellings. Other types pass through:
  # mapping "text" to "string" would lose multiline input.
  describe "#property_type" do
    it "reads an SQL type as the grit type it stands for" do
      {
        "varchar" => "string",
        "timestamp without time zone" => "datetime",
        "numeric" => "decimal",
        "bool" => "boolean",
        "decimal" => "decimal",
        "text" => "text"
      }.each do |data_type_name, property_type|
        expect(described_class.new(identifier: "a_column", data_type_name: data_type_name).property_type).to eq(property_type), data_type_name
      end
    end

    it "takes a declared type over the SQL type" do
      expect(described_class.new(identifier: "a_column", data_type_name: "jsonb", type: "text").property_type).to eq("text")
    end

    # Any other type reaches the grid as a blank cell with no editor.
    it "only ever produces a grit property type" do
      produced = Grit::Core::Model::DynamicSchema::TableDefinition::IMPLEMENTATION_COLUMN_TYPES.values.uniq

      expect(produced - Grit::Core::Model::DynamicSchema::TableDefinition::GRIT_PROPERTY_TYPES).to eq([])
    end
  end
end
