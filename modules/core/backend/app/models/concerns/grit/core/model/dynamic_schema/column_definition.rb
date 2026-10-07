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

module Grit::Core::Model::DynamicSchema::ColumnDefinition
  extend ActiveSupport::Concern
  include Grit::Core::Model::DynamicSchema::ValidIdentifier
  include Grit::Core::Model::DynamicSchema::Refusal

  included do
    belongs_to :data_type, class_name: "Grit::Core::DataType"
    class_attribute :table_definition_association

    # Guards; see `Refusal`.
    validate :refuse_unless_can_modify, except_on: :schema_commit, prepend: true
    validate :identifier_not_implementation_column
    validate :identifier_not_system_column
    validate :identifier_not_display_column_alias
    validate :identifier_unique_in_table
    validate :table_definition_unchanged
    validate :columns_count_within_limit, on: :create
    # Last: the row checks read the draft table, which `check_schema_draft`
    # vouches for.
    validate :check_schema_draft, if: :structural_change?
    validate :check_column_fillable, on: :create, if: :required
    validate :check_column_alterable, on: :update, if: -> { required_changed? || data_type_id_changed? }

    after_create :create_column
    after_update :alter_column
    # On the table's cascade its drop takes the column; see `Refusal`.
    before_destroy :refuse_unless_can_modify, unless: :destroyed_by_parent_definition?
    before_destroy :check_schema_draft, unless: :destroyed_by_parent_definition?
    before_destroy :drop_column, unless: :destroyed_by_parent_definition?
  end

  # nil until the includer calls `belongs_to_table_definition`, so validations
  # skip rather than raise.
  def table_definition
    return if self.class.table_definition_association.nil?
    association(self.table_definition_association).reader
  end

  # See `TableDefinition#schema_definition_in_database`.
  def table_definition_in_database
    return if self.class.table_definition_association.nil?
    foreign_key = self.class.table_definition_foreign_key
    return table_definition if new_record? || !attribute_changed?(foreign_key)
    reflection = association(self.table_definition_association).reflection
    reflection.klass.unscoped.find_by(reflection.association_primary_key => attribute_in_database(foreign_key))
  end

  def committed?
    !!table_definition&.committed?
  end

  # The column's name in a draft. Not a valid identifier, so nothing else can
  # hold it; a commit renames it to the identifier.
  def draft_column_name
    "c#{id}"
  end

  # The column an entity foreign key references.
  def foreign_key_target_column
    Grit::Core::Model::DynamicSchema::TableDefinition::DEFAULT_FOREIGN_KEY_TARGET_COLUMN
  end

  private

  # Whether saving touches the physical column. `name`, `description` and
  # `sort` can change at any time.
  def structural_change?
    return true if new_record?
    return true if identifier_changed? || data_type_id_changed? || required_changed?
    return false if self.class.table_definition_association.nil?
    attribute_changed?(self.class.table_definition_foreign_key)
  end

  # See `Refusal`.
  def destroyed_by_parent_definition?
    destroyed_through?(self.class.table_definition_association)
  end

  # See `TableDefinition#check_schema_draft`.
  def check_schema_draft
    schema = table_definition_in_database&.schema_definition_in_database
    return if schema.nil? || schema.new_record?
    locked = schema.locked_copy
    return unless locked&.committed?
    errors.add(:base, "#{locked.committed_schema_name} is committed: revert it to draft to change its structure")
    throw :abort
  end

  def identifier_not_implementation_column
    return if identifier.blank?
    definition = table_definition
    return if definition.nil?
    return unless definition.implementation_columns.any? { |column| column.identifier == identifier }
    errors.add(:identifier, "is reserved by this table and cannot be used as identifier")
  end

  # PostgreSQL would only refuse these at commit.
  def identifier_not_system_column
    return if identifier.blank?
    return unless Grit::Core::Model::DynamicSchema::ValidIdentifier::SYSTEM_COLUMN_NAMES.include?(identifier)
    errors.add(:identifier, "is a PostgreSQL system column name and cannot be used as identifier")
  end

  # `detailed` names an entity column's display columns `<name>__<property>`. A
  # leading `__` is fine: no alias starts with one.
  def identifier_not_display_column_alias
    return if identifier.blank?
    return unless identifier.index("__", 1)
    errors.add(:identifier, "should not contain a double underscore, which names the display columns of an entity column")
  end

  # Among the table's definitions only; the catalog is not consulted. Includers
  # should back it with a unique index on `[<table>_id, identifier]`.
  def identifier_unique_in_table
    return if self.class.table_definition_association.nil?
    return if identifier.blank?
    foreign_key = self.class.table_definition_foreign_key
    return if self[foreign_key].blank?
    klass = self.class.base_class
    scope = klass.unscoped.where(foreign_key => self[foreign_key], identifier: identifier)
    scope = scope.where.not(id: id) if persisted?
    errors.add(:identifier, "is already taken by another column of this table") if scope.exists?
  end

  def table_definition_unchanged
    return if self.class.table_definition_association.nil?
    return if new_record?
    return unless attribute_changed?(self.class.table_definition_foreign_key)
    errors.add(:base, "A column definition cannot be moved to another table")
  end

  def columns_count_within_limit
    definition = table_definition
    return if definition.nil?
    limit = Grit::Core::Model::DynamicSchema::TableDefinition::MAX_COLUMNS
    return if definition.physical_column_count(excluding: self) < limit
    errors.add(:base, "A table cannot have more than #{limit} columns")
  end

  # A NOT NULL column can't be added to a table with rows.
  def check_column_fillable
    return if errors.any?
    definition = table_definition
    return if definition.nil? || definition.new_record?
    connection = ActiveRecord::Base.connection
    return unless connection.select_value("SELECT 1 FROM #{connection.quote_table_name(definition.draft_table_name)} LIMIT 1")
    errors.add(:base, "Cannot require column with empty values")
  end

  # What `alter_column` would do to the rows, tried before it runs: the type
  # conversion is the same cast, dry-run in a savepoint.
  def check_column_alterable
    return if errors.any?
    definition = table_definition
    return if definition.nil?
    connection = ActiveRecord::Base.connection
    quoted_table_name = connection.quote_table_name(definition.draft_table_name)
    quoted_column_name = connection.quote_column_name(draft_column_name)

    if required_changed? && required && connection.select_value("SELECT 1 FROM #{quoted_table_name} WHERE #{quoted_column_name} IS NULL LIMIT 1")
      errors.add(:base, "Cannot require column with empty values")
    end
    return unless data_type_id_changed?
    previous_data_type = Grit::Core::DataType.find(data_type_id_in_database)
    conflict = "Failed to convert #{previous_data_type.name} to #{data_type.name} because of conflicts in existing rows"

    # Entity ids mean nothing as another type, or as another entity type's ids
    # (two vocabularies share one table).
    if previous_data_type.is_entity || data_type.is_entity
      errors.add(:base, conflict) if connection.select_value("SELECT 1 FROM #{quoted_table_name} WHERE #{quoted_column_name} IS NOT NULL LIMIT 1")
      return
    end

    begin
      ActiveRecord::Base.transaction(requires_new: true) do
        connection.select_value("SELECT count(#{cast_expression(quoted_column_name)}) FROM #{quoted_table_name}")
      end
    rescue ActiveRecord::StatementInvalid => e
      # Bad syntax, out of range and the like; anything else keeps its class
      # (e.g. Deadlocked).
      raise unless e.cause.is_a?(PG::DataException)
      errors.add(:base, conflict)
    end
  end

  # Through text, which every type reads.
  def cast_expression(quoted_column_name)
    "#{quoted_column_name}::text::#{data_type.sql_name}"
  end

  # Column DDL only runs in a draft (`check_schema_draft`), so it uses draft
  # names. What the rows allow is validated beforehand.
  def create_column
    definition = table_definition
    ActiveRecord::Base.connection.add_column definition.draft_table_name, draft_column_name, data_type.sql_name, null: !required
    definition.add_column_foreign_key draft_column_name, data_type.table_name, foreign_key_target_column, owner_id: id if data_type.is_entity
  end

  # Only `required` and the type reach the table: a draft column is named after
  # its id.
  def alter_column
    return unless required_previously_changed? || data_type_id_previously_changed?
    definition = table_definition
    connection = ActiveRecord::Base.connection
    table_name = definition.draft_table_name
    column_name = draft_column_name

    connection.change_column_null table_name, column_name, !required if required_previously_changed?
    return unless data_type_id_previously_changed?
    connection.remove_foreign_key table_name, column: column_name, if_exists: true
    connection.change_column table_name, column_name, data_type.sql_name, using: cast_expression(connection.quote_column_name(column_name))
    definition.add_column_foreign_key column_name, data_type.table_name, foreign_key_target_column, owner_id: id if data_type.is_entity
  end

  # Destroy callbacks also run on unsaved records, which have no column.
  def drop_column
    return if id.nil?
    definition = table_definition_in_database
    schema = definition&.schema_definition_in_database
    return if schema.nil?
    ActiveRecord::Base.connection.remove_column "#{schema.draft_schema_name}.#{definition.draft_table_identifier}", draft_column_name, if_exists: true
  end

  class_methods do
    # `options` go to `belongs_to`; the concern reads the foreign key and its
    # target from the reflection.
    def belongs_to_table_definition(name, **options)
      self.table_definition_association = name
      belongs_to name, **options
    end

    def table_definition_foreign_key
      reflect_on_association(table_definition_association).foreign_key.to_sym
    end
  end
end
