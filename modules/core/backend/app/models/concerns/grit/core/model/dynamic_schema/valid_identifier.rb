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

# Identifier rules shared by schema, table and column definitions: each
# identifier becomes a PostgreSQL name. SQL keywords are allowed on purpose
# (`group` and `order` make natural column names), so any SQL naming them
# must quote them.
module Grit::Core::Model::DynamicSchema::ValidIdentifier
  extend ActiveSupport::Concern

  MAX_IDENTIFIER_LENGTH = 30

  IDENTIFIER_FORMAT = /\A[a-z_]{2}[a-z0-9_]*\z/

  # The base columns of every dynamic table. Extend per includer with
  # `self.reserved_identifiers += %w[...]`.
  DEFAULT_RESERVED_IDENTIFIERS = %w[id created_at created_by updated_at updated_by].freeze

  # Columns PostgreSQL adds to every table; checked for columns only.
  SYSTEM_COLUMN_NAMES = %w[tableoid xmin cmin xmax cmax ctid].freeze

  included do
    class_attribute :reserved_identifiers, default: DEFAULT_RESERVED_IDENTIFIERS

    validates :identifier, presence: true
    validates :identifier, length: { minimum: 2, maximum: MAX_IDENTIFIER_LENGTH }
    validates :identifier, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :identifier, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }
    validate :identifier_not_conflict
    after_validation :explain_committed_identifier
  end

  private

  # Runs on every save: code may reserve an identifier after it was saved.
  def identifier_not_conflict
    return if identifier.blank?
    return unless reserved_identifiers.include?(identifier)
    errors.add("identifier", "is a reserved keyword and cannot be used as identifier")
  end

  # A committed definition whose identifier code has since made invalid can
  # only be fixed after a revert; say so.
  def explain_committed_identifier
    return if errors[:identifier].empty? || new_record? || identifier_changed?
    return unless committed?
    errors.add(:base, "The schema is committed: revert it to draft to change the identifier")
  end
end
