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

module Grit::Core
  class FilterProvider
    @@filters = {}

    def self.register_type(type, operators)
      @@filters[type] = operators
    end

    def self.register_operator(type, operator, lambda)
      @@filters[type] ||= {}
      @@filters[type] = {
        **@@filters[type],
        operator => lambda
      }
    end

    def self.execute(type, operator, property, value)
      raise "Undefined type '#{type}'" if @@filters[type].nil?
      raise "Undefined operator '#{operator}' for type #{type}" if @@filters[type][operator].nil?
      @@filters[type][operator].call(property, value)
    end
  end
end
