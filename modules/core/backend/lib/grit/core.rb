#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

require "grit/core/version"
require "grit/core/engine"
require "grit/core/exporter"
require "grit/core/filter_provider"
require "grit/core/vocabulary_item_loader"
require "test_entity_loader"
require "authlogic"

module Grit
  module Core
    eq = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} = ?", value ]) }
    ne = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} <> ?", value ]) }
    gt = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} > ?", value ]) }
    gte = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} >= ?", value ]) }
    lt = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} < ?", value ]) }
    lte = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} <= ?", value ]) }
    empty = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} IS NULL" ]) }
    empty_text = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} = '' OR #{property} IS NULL" ]) }
    not_empty = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} IS NOT NULL" ]) }
    not_empty_text = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} <> '' OR #{property} IS NOT NULL" ]) }
    contains = lambda do |property, value|
      value.gsub!("_", '\\_')
      value.gsub!("*", "%")
      value.gsub!(".", "_")
      wildcards = %w[% _]
      value = "%#{value}" unless value.start_with?(*wildcards)
      value = "#{value}%" unless value.end_with?(*wildcards)
      ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} ILIKE ?", value ])
    end
    not_contains = lambda do |property, value|
      value.gsub!("_", '\\_')
      value.gsub!("*", "%")
      value.gsub!(".", "_")
      wildcards = %w[% _]
      value = "%#{value}" unless value.start_with?(*wildcards)
      value = "#{value}%" unless value.end_with?(*wildcards)
      ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} NOT ILIKE ?", value ])
    end
    like = lambda do |property, value|
      value.gsub!("_", '\\_')
      value.gsub!("*", "%")
      value.gsub!(".", "_")
      ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} ILIKE ?", value ])
    end
    in_list = lambda do |property, value|
      value = value.to_s.split(",") unless value.kind_of?(Array)
      ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} IN (?)", value ])
    end
    not_in_list = lambda do |property, value|
      value = value.to_s.split(",") unless value.kind_of?(Array)
      ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} NOT IN (?)", value ])
    end
    regexp = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "#{property} ~ ?", value ]) }

    FilterProvider.register_type("string", {
      "eq"=> eq,
      "ne"=> ne,
      "empty"=> empty_text,
      "not_empty"=> not_empty_text,
      "contains"=> contains,
      "not_contains"=> not_contains,
      "like"=> like,
      "in_list"=> in_list,
      "not_in_list"=> not_in_list,
      "regexp"=> regexp
    })
    FilterProvider.register_type("text", {
      "eq"=> eq,
      "ne"=> ne,
      "empty"=> empty_text,
      "not_empty"=> not_empty_text,
      "contains"=> contains,
      "not_contains"=> not_contains,
      "like"=> like,
      "in_list"=> in_list,
      "not_in_list"=> not_in_list,
      "regexp"=> regexp
    })

    FilterProvider.register_type("integer", {
      "eq"=> eq,
      "ne"=> ne,
      "gt"=> gt,
      "gte"=> gte,
      "lt"=> lt,
      "lte"=> lte,
      "empty"=> empty,
      "not_empty"=> not_empty,
      "in_list"=> in_list,
      "not_in_list"=> not_in_list
    })
    FilterProvider.register_type("decimal", {
      "eq"=> eq,
      "ne"=> ne,
      "gt"=> gt,
      "gte"=> gte,
      "lt"=> lt,
      "lte"=> lte,
      "empty"=> empty,
      "not_empty"=> not_empty,
      "in_list"=> in_list,
      "not_in_list"=> not_in_list
    })
    FilterProvider.register_type("float", {
      "eq"=> eq,
      "ne"=> ne,
      "gt"=> gt,
      "gte"=> gte,
      "lt"=> lt,
      "lte"=> lte,
      "empty"=> empty,
      "not_empty"=> not_empty,
      "in_list"=> in_list,
      "not_in_list"=> not_in_list
    })
    FilterProvider.register_type("date", {
      "eq"=> eq,
      "ne"=> ne,
      "gt"=> gt,
      "gte"=> gte,
      "lt"=> lt,
      "lte"=> lte,
      "empty"=> empty,
      "not_empty"=> not_empty
    })
    FilterProvider.register_type("datetime", {
      "eq"=> eq,
      "ne"=> ne,
      "gt"=> gt,
      "gte"=> gte,
      "lt"=> lt,
      "lte"=> lte,
      "empty"=> empty,
      "not_empty"=> not_empty
    })
    FilterProvider.register_type("boolean", {
      "eq"=> eq,
      "ne"=> ne
    })
  end
end
