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

# One entry of `TableDefinition#implementation_column_definitions`, which
# documents the keys. Hashes are coerced through `.coerce`, so a misspelt key
# raises ArgumentError. Every key is optional to construct: a missing
# identifier or type is one of the `problems` the table validates, as are
# other mistakes, so a commit lists them all.
#
# Constants are written in full: the block's lexical scope is the file's.
Grit::Core::Model::DynamicSchema::ImplementationColumn = Data.define(
  :identifier, :data_type_name, :required, :foreign_key, :writable, :presented_when,
  :display_name, :description, :type, :entity, :default_hidden
) do
  def self.coerce(column)
    column.is_a?(self) ? column : new(**column)
  end

  def initialize(identifier: nil, data_type_name: nil, required: false, foreign_key: nil, writable: false,
                 presented_when: nil, display_name: nil, description: nil, type: nil, entity: nil, default_hidden: false)
    super(
      identifier: identifier.to_s,
      data_type_name: data_type_name.to_s,
      required: !!required,
      foreign_key: foreign_key && Grit::Core::Model::DynamicSchema::ImplementationColumn::ForeignKey.coerce(foreign_key),
      writable: !!writable,
      presented_when: presented_when&.to_sym,
      display_name: display_name,
      description: description,
      type: type.presence&.to_s,
      entity: entity,
      default_hidden: !!default_hidden
    )
  end

  # The grit property type: `type`, or what `data_type_name` reads as.
  def property_type
    type || Grit::Core::Model::DynamicSchema::TableDefinition::IMPLEMENTATION_COLUMN_TYPES.fetch(data_type_name, data_type_name)
  end

  # The column the foreign key references, which an entity join is made on.
  def target_column
    foreign_key&.primary_key || Grit::Core::Model::DynamicSchema::TableDefinition::DEFAULT_FOREIGN_KEY_TARGET_COLUMN
  end

  # This column's mistakes, as messages; duplicates are the table's to find.
  # A bad identifier is reported alone, as `identifier` validations do.
  def problems
    return [ "An implementation column is missing an identifier" ] if identifier.empty?
    problem = identifier_problem
    (problem ? [ problem ] : shape_problems).map { |message| "Implementation column #{identifier.inspect} #{message}" }
  end

  private

  # `ValidIdentifier`'s rules, plus the base and system column names.
  def identifier_problem
    rules = Grit::Core::Model::DynamicSchema::ValidIdentifier
    if !rules::IDENTIFIER_FORMAT.match?(identifier)
      "should start with two lowercase letters or underscores and contain only lowercase letters, numbers and underscores"
    elsif identifier.bytesize > rules::MAX_IDENTIFIER_LENGTH
      "is #{identifier.bytesize} bytes; at most #{rules::MAX_IDENTIFIER_LENGTH}"
    elsif rules::DEFAULT_RESERVED_IDENTIFIERS.include?(identifier)
      "is a base column of every dynamic table"
    elsif rules::SYSTEM_COLUMN_NAMES.include?(identifier)
      "is a PostgreSQL system column name"
    elsif identifier.index("__", 1)
      # See `ColumnDefinition#identifier_not_display_column_alias`.
      "should not contain a double underscore, which names the display columns of an entity column"
    end
  end

  # An unmapped `data_type_name` (`jsonb`, `inet`, ...) needs an explicit
  # `type:`, or the UI gets a property type it cannot render; `type:` itself
  # must name one for the same reason.
  def shape_problems
    property_types = Grit::Core::Model::DynamicSchema::TableDefinition::GRIT_PROPERTY_TYPES
    problems = []
    problems.push("is missing a data_type_name") if data_type_name.empty?
    problems.push("is declared as an entity but carries no entity definition") if type == "entity" && entity.nil?
    if type
      problems.push("has type #{type.inspect}, which is not one of #{property_types.join(", ")}") unless property_types.include?(type)
    elsif !data_type_name.empty? && !property_types.include?(property_type)
      problems.push("has data_type_name #{data_type_name.inspect}, which is not one of #{property_types.join(", ")}; declare the grit property type with type:")
    end
    problems.push("has a foreign key with no table_name") if foreign_key && foreign_key.table_name.empty?
    problems
  end
end

# An implementation column's `foreign_key:`; `primary_key` is the target column.
Grit::Core::Model::DynamicSchema::ImplementationColumn::ForeignKey = Data.define(:table_name, :primary_key) do
  def self.coerce(foreign_key)
    foreign_key.is_a?(self) ? foreign_key : new(**foreign_key)
  end

  def initialize(table_name: nil, primary_key: nil)
    super(
      table_name: table_name.to_s,
      primary_key: (primary_key || Grit::Core::Model::DynamicSchema::TableDefinition::DEFAULT_FOREIGN_KEY_TARGET_COLUMN).to_s
    )
  end
end
