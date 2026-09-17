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

  # Only class-level declarations belong in `included do`. Instance methods stay
  # in the module body so that an includer can override any of them and call
  # `super`; a `def` inside `included do` is defined directly on the includer,
  # which puts it out of reach of `super` and silently wins over anything the
  # includer declares.
  #
  # Note that module-level definitions are *not* enough on their own to keep
  # `table_definition` from recursing when an includer names its association
  # `table_definition` too: ActiveRecord includes `GeneratedAssociationMethods`
  # from `inherited`, i.e. before the class body runs, so this module still sits
  # above it in the ancestor chain and shadows the generated reader. The
  # accessors below therefore go through `association(...).reader` — the same
  # thing the generated reader does — rather than `send`, which would dispatch
  # straight back here.
  included do
    belongs_to :data_type, class_name: "Grit::Core::DataType"
    class_attribute :table_definition_association

    validate :identifier_not_implementation_column

    before_save :check_can_modify
    before_create :check_columns_count
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

  # `reserved_identifiers` is a static class attribute, so it cannot know what
  # the *table* this column belongs to adds on top of the base columns. Without
  # this, a dynamic column taking an implementation column's name passes every
  # validation and then raises PG::DuplicateColumn from inside
  # `after_create :create_column` — a 500 where a validation error belongs.
  #
  # This is what makes the documented `self.reserved_identifiers += %w[...]`
  # dance unnecessary for implementation columns: declaring one reserves it.
  def identifier_not_implementation_column
    return if identifier.blank? || !identifier_changed?
    definition = table_definition
    return if definition.nil?
    return unless definition.implementation_column_definitions.any? { |column| column[:identifier].to_s == identifier }
    errors.add(:identifier, "is reserved by this table and cannot be used as identifier")
  end

  def check_columns_count
    # `.count`, not `.length`: the guard has to be authoritative at insert time,
    # and `.length` would load every sibling definition into memory to answer it.
    raise "A table cannot have more than 250 columns" if table_definition.column_definitions.count >= 250
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
      # RENAME COLUMN leaves the constraint name alone, so it keeps the old
      # column name embedded — and the column name is now the whole of the
      # constraint name's first half. Harmless on its own, since
      # `foreign_key_for_column` resolves constraints by column rather than by
      # name, but a later column taking the freed identifier would compute the
      # very same name and collide with PG::DuplicateObject. Re-canonicalise now.
      table_definition.rename_foreign_key_for_column(column.identifier)
      # Before the two branches below, which build a `record_klass` and would
      # otherwise read the pre-rename column list out of the schema cache.
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
      rescue ActiveRecord::InvalidForeignKey => e
        raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows"
      rescue ActiveRecord::StatementInvalid => e
        raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows" if /invalid input syntax for type/.match?(e.to_s)
        raise e.to_s
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
