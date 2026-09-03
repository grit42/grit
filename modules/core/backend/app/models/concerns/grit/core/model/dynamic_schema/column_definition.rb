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

    validate :identifier_not_active_record_method
    validate :identifier_not_implementation_column
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

  def identifier_not_active_record_method
    return unless identifier_changed?
    return if identifier.blank?
    return unless ActiveRecord::Base.instance_methods.include?(identifier.to_sym)
    errors.add(:identifier, "conflicts with a method every record already has and cannot be used as identifier")
  end

  def identifier_not_implementation_column
    return if identifier.blank? || !identifier_changed?
    definition = table_definition
    return if definition.nil?
    return unless definition.implementation_column_definitions.any? { |column| column[:identifier].to_s == identifier }
    errors.add(:identifier, "is reserved by this table and cannot be used as identifier")
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
    return if definition.physical_column_count < limit
    errors.add(:base, "A table cannot have more than #{limit} columns")
  end

  def table_definition
    association(self.table_definition_association).reader
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

    connection.add_column table_definition.table_name, identifier, data_type.sql_name, null: !required
    table_definition.refresh_schema!
    connection.add_foreign_key table_definition.table_name, data_type.table_name, column: identifier, primary_key: foreign_key_target_column, name: table_definition.foreign_key_name(identifier, foreign_key_target_column), if_not_exists: true if data_type.is_entity
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
        connection.add_foreign_key table_definition.table_name, column.data_type.table_name, column: column.identifier, primary_key: foreign_key_target_column, name: table_definition.foreign_key_name(column.identifier, foreign_key_target_column), if_not_exists: true if column.data_type.is_entity
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

  def drop_column
    return unless table_definition.table_exists?
    ActiveRecord::Base.connection.remove_column table_definition.table_name, identifier, if_exists: true
    table_definition.refresh_schema!
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
