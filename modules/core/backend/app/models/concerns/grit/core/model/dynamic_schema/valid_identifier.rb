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

  MAX_IDENTIFIER_LENGTH = 30

  IDENTIFIER_FORMAT = /\A[a-z_]{2}[a-z0-9_]*\z/

  # Names a dynamic column may not take because every dynamic table has them
  # already.
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
    return if identifier.blank?
    return unless reserved_identifiers.include?(identifier)
    errors.add("identifier", "is a reserved keyword and cannot be used as identifier")
  end
end
