#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-assays.
#
# grit-assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-assays. If not, see <https://www.gnu.org/licenses/>.
#++

require "grit/core/filter_provider"

module Grit
  module Assays
    # Translates a react-awesome-query-builder JsonTree (as stored in
    # grit_assays_analyses.filters) into a parenthesised SQL fragment usable
    # with ActiveRecord::Relation#where.
    #
    # The tree shape is:
    #   group  = { "type" => "group", "properties" => { "conjunction" => "AND"|"OR", "not" => bool },
    #              "children1" => [group|rule, ...] }
    #   rule   = { "type" => "rule",  "properties" => { "field" => name, "operator" => op,
    #              "value" => [v, ...] } }
    #
    # Incomplete branches (missing field/operator/value, unknown field, unknown
    # operator) are silently dropped — RAQB persists draft trees, so a partly
    # built rule must not blow up downstream reads.
    module JsonTreeFilter
      # Maps RAQB operator names to FilterProvider operator names.
      RAQB_OPERATOR_MAP = {
        "equal"             => "eq",
        "not_equal"         => "ne",
        "less"              => "lt",
        "less_or_equal"     => "lte",
        "greater"           => "gt",
        "greater_or_equal"  => "gte",
        "like"              => "contains",
        "not_like"          => "not_contains",
        "starts_with"       => "starts_with",
        "ends_with"         => "ends_with",
        "is_empty"          => "empty",
        "is_not_empty"      => "not_empty",
        "is_null"           => "empty",
        "is_not_null"       => "not_empty",
        "select_equals"     => "eq",
        "select_not_equals" => "ne",
        "select_any_in"     => "in_list",
        "select_not_any_in" => "not_in_list"
      }.freeze

      # Maps property.type (from entity_properties) to FilterProvider type bucket.
      # Mirrors PROPERTY_TYPE_TO_QB_TYPE in buildFiltersFields.ts.
      PROPERTY_TYPE_MAP = {
        "string"    => "string",
        "text"      => "text",
        "integer"   => "integer",
        "decimal"   => "decimal",
        "numeric"   => "decimal",
        "float"     => "float",
        "date"      => "date",
        "datetime"  => "datetime",
        "timestamp" => "datetime",
        "boolean"   => "boolean",
        "entity"    => "integer"
      }.freeze

      # Operators that don't carry a value — skip the missing-value guard.
      NULLARY_OPERATORS = %w[empty not_empty].freeze

      class << self
        # Returns a parenthesised SQL fragment suitable for .where(sql), or nil
        # when the tree contributes no constraints.
        #
        # @param tree [Hash, nil] the deserialised JsonTree (string keys)
        # @param properties [Array<Hash>] entity_properties for the dynamic record class
        # @param table_qualifier [String, nil] optional table name to prepend to each column
        def to_sql(tree:, properties:, table_qualifier: nil)
          return nil unless tree.is_a?(Hash)

          properties_by_name = properties.each_with_object({}) do |prop, memo|
            name = (prop[:name] || prop["name"]).to_s
            memo[name] = prop unless name.empty?
          end

          walk(tree, properties_by_name, table_qualifier)
        end

        private

        def walk(node, properties_by_name, table_qualifier)
          case node["type"]
          when "group", "rule_group"
            walk_group(node, properties_by_name, table_qualifier)
          when "rule"
            walk_rule(node, properties_by_name, table_qualifier)
          end
        end

        def walk_group(group, properties_by_name, table_qualifier)
          children = group["children1"] || []
          children = children.values if children.is_a?(Hash) # RAQB sometimes serialises as id-keyed map
          fragments = children.map { |c| walk(c, properties_by_name, table_qualifier) }.compact
          return nil if fragments.empty?

          props = group["properties"] || {}
          conjunction = props["conjunction"] == "OR" ? "OR" : "AND"
          sql = "(#{fragments.join(" #{conjunction} ")})"
          props["not"] ? "NOT #{sql}" : sql
        end

        def walk_rule(rule, properties_by_name, table_qualifier)
          props = rule["properties"] || {}
          field = props["field"]
          operator = props["operator"]
          return nil if field.nil? || operator.nil?

          property = properties_by_name[field.to_s]
          return nil if property.nil?

          property_type = (property[:type] || property["type"]).to_s
          filter_type = PROPERTY_TYPE_MAP[property_type]
          return nil if filter_type.nil?

          filter_operator = RAQB_OPERATOR_MAP[operator]
          return nil if filter_operator.nil?

          value = unwrap_value(props["value"], filter_operator)
          return nil if value.nil? && !NULLARY_OPERATORS.include?(filter_operator)

          column = table_qualifier ? "#{quote(table_qualifier)}.#{quote(field)}" : quote(field)

          begin
            Grit::Core::FilterProvider.execute(filter_type, filter_operator, column, value)
          rescue StandardError
            nil
          end
        end

        # RAQB's JsonTree always wraps `value` as an array. Single-value operators
        # take the first element; multi-value (`in_list`) takes the whole array.
        def unwrap_value(raw, filter_operator)
          return nil if raw.nil?
          values = raw.is_a?(Array) ? raw : [ raw ]
          return nil if values.empty?

          if %w[in_list not_in_list].include?(filter_operator)
            # RAQB serialises multiselect values as [["a","b","c"]] (the outer
            # array is the JsonTree value slot, the inner is the selection);
            # accept the flat form too in case a caller sends [a, b, c].
            candidate = values.first.is_a?(Array) ? values.first : values
            cleaned = candidate.compact
            cleaned.empty? ? nil : cleaned
          else
            values.first
          end
        end

        def quote(identifier)
          ActiveRecord::Base.connection.quote_column_name(identifier)
        end
      end
    end
  end
end
