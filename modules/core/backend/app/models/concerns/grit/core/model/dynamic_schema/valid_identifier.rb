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

# The rules every dynamic-schema identifier is held to, in one place: a schema's,
# a table's and a column's identifier each become a PostgreSQL identifier of its
# own, so they all have to be lowercase and free of anything PostgreSQL would
# need quoting for.
#
# Included by all three of SchemaDefinition, TableDefinition and ColumnDefinition.
module Grit::Core::Model::DynamicSchema::ValidIdentifier
  extend ActiveSupport::Concern

  # Longest any one identifier may be. PostgreSQL's own limit is 63 bytes
  # (NAMEDATALEN - 1) *per identifier*, and since each of the three names its own
  # object — a schema, a table, a column — none of them is what binds here.
  #
  # What binds is the one name still built by concatenation: a foreign key
  # constraint is called `<column identifier>_<referenced column>`, so two
  # identifiers and one separator have to fit in 63 bytes. 30 + 1 + 30 = 61.
  #
  # PostgreSQL truncates over-long identifiers silently, at parse time, so a
  # limit that drifted upwards would not fail — it would let two columns whose
  # names differ only past byte 63 share one constraint.
  MAX_IDENTIFIER_LENGTH = 30

  # The two format validations below as one expression, for identifiers checked
  # outside a `validates` call: the schema prefix, and the hand-written
  # identifiers in `implementation_column_definitions`.
  IDENTIFIER_FORMAT = /\A[a-z_]{2}[a-z0-9_]*\z/

  # Names a dynamic column may not take because every dynamic table has them
  # already. Frozen, and replaced rather than mutated by the includer:
  # `class_attribute` hands every includer the same object, so a `<<` on the
  # default would leak the addition to every other class.
  #
  #   self.reserved_identifiers += %w[experiment_id]
  DEFAULT_RESERVED_IDENTIFIERS = %w[id created_at created_by updated_at updated_by].freeze

  included do
    class_attribute :reserved_identifiers, default: DEFAULT_RESERVED_IDENTIFIERS

    validates :identifier, presence: true
    validates :identifier, length: { minimum: 2, maximum: MAX_IDENTIFIER_LENGTH }
    validates :identifier, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :identifier, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }
    validate :identifier_not_conflict
  end

  def identifier_not_conflict
    return unless identifier_changed?
    # `presence: true` does not short-circuit the other validations, so a
    # blank identifier still reaches here — and `nil.to_sym` is a NoMethodError.
    return if identifier.blank?
    if ActiveRecord::Base.instance_methods.include?(identifier.to_sym) || reserved_identifiers.include?(identifier)
      errors.add("identifier", "is a reserved keyword and cannot be used as identifier")
    end
  end
end
