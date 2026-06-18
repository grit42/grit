# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/assays.
#
# @grit42/assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/assays. If not, see <https://www.gnu.org/licenses/>.


require "rails_helper"

RSpec.describe Grit::Assays::JsonTreeFilter do
  let(:properties) do
    [
      { name: "name", type: "string" },
      { name: "score", type: "integer" },
      { name: "ratio", type: "decimal" },
      { name: "started_at", type: "datetime" },
      { name: "active", type: "boolean" },
      { name: "compound_id", type: "entity" }
    ]
  end

  def group(conjunction: "AND", not_: false, children: [])
    {
      "id" => "g1",
      "type" => "group",
      "properties" => { "conjunction" => conjunction, "not" => not_ },
      "children1" => children
    }
  end

  def rule(field:, operator:, value: nil, id: SecureRandom.uuid)
    {
      "id" => id,
      "type" => "rule",
      "properties" => { "field" => field, "operator" => operator, "value" => value }
    }
  end

  describe ".to_sql" do
    it "returns nil for a nil tree" do
      expect(described_class.to_sql(tree: nil, properties: properties)).to be_nil
    end

    it "returns nil for a non-Hash tree" do
      expect(described_class.to_sql(tree: "junk", properties: properties)).to be_nil
    end

    it "returns nil for an empty group" do
      expect(described_class.to_sql(tree: group, properties: properties)).to be_nil
    end

    it "translates a single string-eq rule" do
      tree = group(children: [ rule(field: "name", operator: "equal", value: [ "Acme" ]) ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to include("= 'Acme'")
      expect(sql).to include("name")
      expect(sql).to start_with("(").and end_with(")")
    end

    it "translates numeric comparisons" do
      tree = group(children: [
        rule(field: "score", operator: "greater_or_equal", value: [ 10 ]),
        rule(field: "score", operator: "less", value: [ 100 ])
      ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to include(">= 10").and include("< 100")
      expect(sql).to include(" AND ")
    end

    it "joins rules with OR when conjunction is OR" do
      tree = group(conjunction: "OR", children: [
        rule(field: "name", operator: "equal", value: [ "a" ]),
        rule(field: "name", operator: "equal", value: [ "b" ])
      ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to include(" OR ")
    end

    it "wraps with NOT when properties.not is true" do
      tree = group(not_: true, children: [ rule(field: "name", operator: "equal", value: [ "a" ]) ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to start_with("NOT (")
    end

    it "handles nested groups with correct precedence via parentheses" do
      inner = group(conjunction: "OR", children: [
        rule(field: "name", operator: "equal", value: [ "a" ]),
        rule(field: "name", operator: "equal", value: [ "b" ])
      ])
      tree = group(conjunction: "AND", children: [
        inner,
        rule(field: "score", operator: "greater", value: [ 5 ])
      ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      # outer wraps, inner wraps separately
      expect(sql).to start_with("(")
      expect(sql.scan("(").size).to be >= 2
      expect(sql).to include(" OR ")
      expect(sql).to include(" AND ")
    end

    it "skips rules with unknown fields" do
      tree = group(children: [
        rule(field: "ghost", operator: "equal", value: [ "x" ]),
        rule(field: "name", operator: "equal", value: [ "ok" ])
      ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to include("'ok'")
      expect(sql).not_to include("ghost")
    end

    it "skips rules with unknown operators" do
      tree = group(children: [
        rule(field: "name", operator: "between", value: [ "a", "z" ]),
        rule(field: "name", operator: "equal", value: [ "ok" ])
      ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to include("'ok'")
      expect(sql).not_to match(/BETWEEN/i)
    end

    it "skips rules with missing field or operator" do
      tree = group(children: [
        { "id" => "r1", "type" => "rule", "properties" => { "field" => nil, "operator" => "equal", "value" => [ "x" ] } },
        { "id" => "r2", "type" => "rule", "properties" => { "field" => "name", "operator" => nil, "value" => [ "x" ] } },
        rule(field: "name", operator: "equal", value: [ "ok" ])
      ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to include("'ok'")
    end

    it "skips value-bearing rules without a value" do
      tree = group(children: [
        rule(field: "name", operator: "equal", value: []),
        rule(field: "name", operator: "equal", value: nil)
      ])
      expect(described_class.to_sql(tree: tree, properties: properties)).to be_nil
    end

    it "supports nullary operators (is_empty, is_not_empty)" do
      tree = group(children: [
        rule(field: "name", operator: "is_empty", value: nil),
        rule(field: "score", operator: "is_not_null", value: nil)
      ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to match(/IS NOT NULL|<>\s*''/)
      expect(sql).to match(/IS NULL|=\s*''/)
    end

    it "passes an array for in_list / not_in_list operators" do
      tree = group(children: [
        rule(field: "name", operator: "select_any_in", value: [ [ "a", "b", "c" ] ])
      ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to include("IN (")
      expect(sql).to include("'a'").and include("'b'").and include("'c'")
    end

    it "translates starts_with to an anchored ILIKE pattern" do
      tree = group(children: [ rule(field: "name", operator: "starts_with", value: [ "Acme" ]) ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to match(/ILIKE 'Acme%'/i)
    end

    it "translates ends_with to a trailing-anchored ILIKE pattern" do
      tree = group(children: [ rule(field: "name", operator: "ends_with", value: [ "Corp" ]) ])
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to match(/ILIKE '%Corp'/i)
    end

    it "qualifies columns with the supplied table_qualifier" do
      tree = group(children: [ rule(field: "name", operator: "equal", value: [ "x" ]) ])
      sql = described_class.to_sql(
        tree: tree,
        properties: properties,
        table_qualifier: "ds_42"
      )
      expect(sql).to include("ds_42")
      expect(sql).to match(/"?ds_42"?\.\"?name\"?/)
    end

    it "supports string-keyed property hashes too" do
      props = [ { "name" => "name", "type" => "string" } ]
      tree = group(children: [ rule(field: "name", operator: "equal", value: [ "x" ]) ])
      sql = described_class.to_sql(tree: tree, properties: props)
      expect(sql).to include("'x'")
    end

    context "entity type" do
      it "translates equal to an integer equality check" do
        tree = group(children: [ rule(field: "compound_id", operator: "equal", value: [ 42 ]) ])
        sql = described_class.to_sql(tree: tree, properties: properties)
        expect(sql).to include("= 42")
        expect(sql).to include("compound_id")
      end

      it "translates select_any_in to an IN clause" do
        tree = group(children: [
          rule(field: "compound_id", operator: "select_any_in", value: [ [ 1, 2, 3 ] ])
        ])
        sql = described_class.to_sql(tree: tree, properties: properties)
        expect(sql).to include("IN (")
        expect(sql).to include("1").and include("2").and include("3")
      end

      it "supports is_null and is_not_null on entity fields" do
        tree = group(children: [
          rule(field: "compound_id", operator: "is_null", value: nil),
          rule(field: "compound_id", operator: "is_not_null", value: nil)
        ])
        sql = described_class.to_sql(tree: tree, properties: properties)
        expect(sql).to match(/IS NULL/)
        expect(sql).to match(/IS NOT NULL/)
      end
    end

    it "tolerates children1 serialised as id-keyed map" do
      r = rule(field: "name", operator: "equal", value: [ "x" ])
      tree = group.merge("children1" => { r["id"] => r })
      sql = described_class.to_sql(tree: tree, properties: properties)
      expect(sql).to include("'x'")
    end

    it "collapses a nested group containing only invalid rules to nil" do
      tree = group(children: [
        group(children: [ rule(field: "ghost", operator: "equal", value: [ "x" ]) ])
      ])
      expect(described_class.to_sql(tree: tree, properties: properties)).to be_nil
    end
  end
end
