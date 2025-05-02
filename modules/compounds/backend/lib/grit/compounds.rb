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

require "grit/compounds/version"
require "grit/compounds/engine"
require "grit/core/filter_provider"
require "grit/compounds/compound_loader"
require "grit/compounds/batch_loader"

module Grit
  module Compounds
    contains = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "mol_from_ctab(#{property}::cstring) @> ?::qmol", value ]) }
    not_contains = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "NOT mol_from_ctab(#{property}::cstring) @> ?::qmol", value ]) }
    eq = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "mol_from_ctab(#{property}::cstring) @= ?", value ]) }
    ne = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "NOT mol_from_ctab(#{property}::cstring) @= ?", value ]) }
    empty = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "mol_from_ctab(#{property}::cstring) IS NULL" ]) }
    not_empty = lambda { |property, value| ActiveRecord::Base.send(:sanitize_sql_array, [ "mol_from_ctab(#{property}::cstring) IS NOT NULL" ]) }

    Grit::Core::FilterProvider.register_type("mol", {
      "eq"=> eq,
      "ne"=> ne,
      "empty"=> empty,
      "not_empty"=> not_empty,
      "contains"=> contains,
      "not_contains"=> not_contains
    })
  end
end
