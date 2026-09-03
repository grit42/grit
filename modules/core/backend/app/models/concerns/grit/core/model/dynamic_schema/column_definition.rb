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

    before_save :check_can_modify
    before_create :check_columns_count
    after_create :create_column
    after_update :alter_column
    before_destroy :check_can_modify
    before_destroy :drop_column

    validates :identifier, presence: true
    validates :identifier, length: { minimum: 2, maximum: 15 }
    validates :identifier, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :identifier, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }

    def check_can_modify
      raise "Cannot modify column definition #{self.id}"
    end

    def check_columns_count
      raise "A table cannot have more than 250 columns" if table_definition.column_definitions.length >= 250
    end

    def table_definition
      self.send(self.table_definition_association)
    end

    def quoted_identifier
      ActiveRecord::Base.connection.quote_column_name(identifier)
    end

    def create_column_in_block t
      t.column identifier, data_type.sql_name, null: !required
      return self if data_type.is_entity
    end

    def create_column
      return unless table_definition.table_exists?
      connection = ActiveRecord::Base.connection

      column = self
      type = (column.data_type.is_entity or column[:type].to_s == "integer") ? :bigint : column.data_type.sql_name

      connection.add_column table_definition.table_name, column.identifier, type, null: !column.required
      connection.add_foreign_key table_definition.table_name, column.data_type.table_name, column: column.identifier, name: "#{table_definition.table_name}_#{column.identifier}", if_not_exists: true if column.data_type.is_entity
      ActiveRecord::Base.descendants.find { |m| m.table_name == table_definition.table_name }&.reset_column_information
    end

    def alter_column
      return unless table_definition.table_exists?
      refresh_cache = false
      column = self
      connection = ActiveRecord::Base.connection
      if identifier_previously_changed?
        connection.rename_column table_definition.table_name, column.identifier_previously_was, column.identifier
        refresh_cache = true
      end
      if required_previously_changed?
        raise "Cannot require column with empty values" if column.required && table_definition.record_klass.where(identifier => nil).count().positive?
        connection.change_column_null table_definition.table_name, column.identifier, !column.required
        refresh_cache = true
      end
      if data_type_id_previously_changed?
        previous_data_type = Grit::Core::DataType.find(data_type_id_previously_was)
        raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows" if (previous_data_type.is_entity || column.data_type.is_entity) && table_definition.record_klass.count(identifier).positive?
        begin
          connection.remove_foreign_key table_definition.table_name, column: column.identifier, if_exists: true

          connection.change_column table_definition.table_name, column.identifier, column.data_type.sql_name, using: "#{connection.quote_column_name(column.identifier)}::text::#{column.data_type.sql_name}"
          connection.add_foreign_key table_definition.table_name, column.data_type.table_name, column: column.identifier, name: "#{table_definition.table_name}_#{column.identifier}", if_not_exists: true if column.data_type.is_entity
          refresh_cache = true
        rescue ActiveRecord::InvalidForeignKey => e
          raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows"
        rescue ActiveRecord::StatementInvalid => e
          raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows" if /invalid input syntax for type/.match?(e.to_s)
          raise e.to_s
        end
      end
      ActiveRecord::Base.descendants.find { |m| m.table_name == table_definition.table_name }&.reset_column_information if refresh_cache
    end


    def drop_column
      return unless table_definition.table_exists?
      connection = ActiveRecord::Base.connection
      ActiveRecord::Base.connection.remove_column table_definition.table_name, identifier, if_exists: true
      ActiveRecord::Base.descendants.find { |m| m.table_name == table_definition.table_name }&.reset_column_information
    end
  end

  class_methods do
    def belongs_to_table_definition table_definition_association
      self.table_definition_association = table_definition_association
      belongs_to self.table_definition_association
    end

    def table_definition_id
      "#{self.table_definition_association.to_s}_id".to_sym
    end
  end
end
