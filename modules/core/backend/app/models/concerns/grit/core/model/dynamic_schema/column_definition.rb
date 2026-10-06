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

  included do
    belongs_to :data_type, class_name: "Grit::Core::DataType"
    class_attribute :table_definition_association

    validate :identifier_not_implementation_column
    validate :identifier_not_system_column
    validate :identifier_not_display_column_alias
    validate :identifier_unique_in_table
    validate :table_definition_unchanged
    validate :columns_count_within_limit, on: :create

    before_save :check_can_modify
    after_create :create_column
    after_update :alter_column
    before_destroy :check_can_modify
    before_destroy :drop_column
  end

  # Guard run before every save and before destroy. A no-op by default so that
  # includers are free to create, update and destroy definitions. Override it
  # to forbid modification once the schema is in use, e.g.:
  #
  #   def check_can_modify
  #     super
  #     raise "Cannot modify a published data set" if published?
  #   end
  def check_can_modify
  end

  def identifier_not_implementation_column
    return if identifier.blank? || !identifier_changed?
    definition = table_definition
    return if definition.nil?
    return unless definition.implementation_column_definitions.any? { |column| column[:identifier].to_s == identifier }
    errors.add(:identifier, "is reserved by this table and cannot be used as identifier")
  end

  # Not caught by `identifier_taken_on_physical_table?`, which only sees the
  # columns a table was built with: PostgreSQL would refuse the name at DDL time.
  def identifier_not_system_column
    return if identifier.blank? || !identifier_changed?
    return unless Grit::Core::Model::DynamicSchema::ValidIdentifier::SYSTEM_COLUMN_NAMES.include?(identifier)
    errors.add(:identifier, "is a PostgreSQL system column name and cannot be used as identifier")
  end

  # `detailed` selects each display property of an entity column `<name>` as
  # `<name>__<display property>`. A column named like one of those would come back
  # twice under one name, and a sort or filter on it would act on the entity's
  # column instead. A leading `__` is allowed: `<name>` is at least two characters,
  # so no alias starts with one.
  def identifier_not_display_column_alias
    return if identifier.blank? || !identifier_changed?
    return unless identifier.index("__", 1)
    errors.add(:identifier, "should not contain a double underscore, which names the display columns of an entity column")
  end

  # Note: an includer should also add a unique index on `[<table>_id, identifier]`
  def identifier_unique_in_table
    return if self.class.table_definition_association.nil?
    return if identifier.blank?
    foreign_key = self.class.table_definition_id
    return if self[foreign_key].blank?
    return unless new_record? || identifier_changed? || attribute_changed?(foreign_key)
    klass = self.class.base_class
    scope = klass.unscoped.where(foreign_key => self[foreign_key], identifier: identifier)
    scope = scope.where.not(id: id) if persisted?
    if scope.exists?
      errors.add(:identifier, "is already taken by another column of this table")
    elsif identifier_taken_on_physical_table?
      errors.add(:identifier, "is already taken: the column #{identifier} already exists on #{table_definition.table_name}")
    end
  end

  def identifier_taken_on_physical_table?
    return false if errors[:identifier].any?
    definition = table_definition
    return false if definition.nil? || !definition.table_exists?
    ActiveRecord::Base.connection.column_exists?(definition.table_name, identifier)
  end

  def table_definition_unchanged
    return if self.class.table_definition_association.nil?
    return if new_record?
    return unless attribute_changed?(self.class.table_definition_id)
    errors.add(:base, "A column definition cannot be moved to another table")
  end

  def columns_count_within_limit
    definition = table_definition
    return if definition.nil?
    limit = Grit::Core::Model::DynamicSchema::TableDefinition::MAX_COLUMNS
    return if definition.physical_column_count(excluding: self) < limit
    errors.add(:base, "A table cannot have more than #{limit} columns")
  end

  # nil until the includer calls `belongs_to_table_definition`, so that every
  # validation reading it is skipped, as the ones checking
  # `table_definition_association` are, rather than raising
  # AssociationNotFoundError.
  def table_definition
    return if self.class.table_definition_association.nil?
    association(self.table_definition_association).reader
  end

  # The table definition this column's saved row belongs to. See
  # `TableDefinition#schema_definition_in_database`.
  def table_definition_in_database
    return if self.class.table_definition_association.nil?
    foreign_key = self.class.table_definition_id
    return table_definition unless attribute_changed?(foreign_key)
    association(self.table_definition_association).klass.unscoped.find_by(id: attribute_in_database(foreign_key))
  end

  def quoted_identifier
    ActiveRecord::Base.connection.quote_column_name(identifier)
  end

  # The column an entity reference points at. Split out so that both the create
  # and the convert path name their constraint after the same thing the
  # constraint actually references.
  def foreign_key_target_column
    Grit::Core::Model::DynamicSchema::TableDefinition::DEFAULT_FOREIGN_KEY_TARGET_COLUMN
  end

  def create_column
    return unless table_definition.table_exists?
    connection = ActiveRecord::Base.connection
    # A NOT NULL column with no default fails on any existing row, with a
    # PG::NotNullViolation rather than the message `alter_column` gives.
    raise "Cannot require column with empty values" if required && connection.select_value("SELECT 1 FROM #{table_definition.quoted_table_name} LIMIT 1")

    connection.add_column table_definition.table_name, identifier, data_type.sql_name, null: !required
    table_definition.refresh_schema!
    table_definition.add_column_foreign_key identifier, data_type.table_name, foreign_key_target_column if data_type.is_entity
  end

  def alter_column
    return unless table_definition.table_exists?
    column = self
    connection = ActiveRecord::Base.connection
    if identifier_previously_changed?
      connection.rename_column table_definition.table_name, column.identifier_previously_was, column.identifier
      table_definition.rename_foreign_key_for_column(column.identifier)
      table_definition.refresh_schema!
    end
    if required_previously_changed?
      raise "Cannot require column with empty values" if column.required && table_definition.record_klass.where(identifier => nil).count().positive?
      connection.change_column_null table_definition.table_name, column.identifier, !column.required
      table_definition.refresh_schema!
    end
    if data_type_id_previously_changed?
      previous_data_type = Grit::Core::DataType.find(data_type_id_previously_was)
      raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows" if (previous_data_type.is_entity || column.data_type.is_entity) && table_definition.record_klass.count(identifier).positive?
      begin
        connection.remove_foreign_key table_definition.table_name, column: column.identifier, if_exists: true

        connection.change_column table_definition.table_name, column.identifier, column.data_type.sql_name, using: "#{connection.quote_column_name(column.identifier)}::text::#{column.data_type.sql_name}"
        table_definition.add_column_foreign_key column.identifier, column.data_type.table_name, foreign_key_target_column if column.data_type.is_entity
        table_definition.refresh_schema!
      rescue ActiveRecord::InvalidForeignKey
        raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows"
      rescue ActiveRecord::StatementInvalid => e
        raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows" if /invalid input syntax for type/.match?(e.to_s)
        # Bare `raise`, not `raise e.to_s`, which would rebuild the failure as a
        # RuntimeError carrying the message and nothing else. Everything a caller
        # has to tell a deadlock, a lock timeout or a NOT NULL violation apart —
        # the class, the cause, the backtrace — lives on the original, and a
        # rescue on ActiveRecord::Deadlocked stops matching without it.
        raise
      end
    end
  end

  # By the names saved in the database, as `TableDefinition#drop_table` does: a
  # rename `identifier_unique_in_table` refused leaves another column's name in
  # `identifier`.
  def drop_column
    saved_identifier = identifier_in_database
    definition = table_definition_in_database
    return if saved_identifier.nil? || definition.nil?
    table_name = definition.table_name_in_database
    connection = ActiveRecord::Base.connection
    return if table_name.nil? || !connection.table_exists?(table_name)
    connection.remove_column table_name, saved_identifier, if_exists: true
    definition.refresh_schema! table_name
  end

  class_methods do
    def belongs_to_table_definition(table_definition_association)
      self.table_definition_association = table_definition_association
      belongs_to self.table_definition_association
    end

    def table_definition_id
      "#{self.table_definition_association}_id".to_sym
    end
  end
end
