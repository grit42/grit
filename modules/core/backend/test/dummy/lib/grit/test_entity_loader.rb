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

require "grit/core/entity_loader"

module Grit
  class TestEntityLoader < Grit::Core::EntityLoader
    protected
    # Dummy validation to produce warnings if the record has errors, used in e2e tests
    def self.validate_record(load_set_entity, record, record_props, context)
      has_warnings = false
      if record[:record_errors].nil?
        load_set_entity_record = load_set_entity.new(record_props)
        record[:record_errors] = load_set_entity_record.errors unless load_set_entity_record.valid?
      end
      if record[:record_errors].present?
        has_warnings = true
        record[:record_warnings] = record[:record_errors].each_with_object({}) { |(key), memo| memo[key] = [ "has an error" ] }
      end

      { has_warnings: has_warnings }
    end
  end
end
