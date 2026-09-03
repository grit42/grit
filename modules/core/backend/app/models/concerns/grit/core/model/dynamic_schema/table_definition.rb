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

module Grit::Core::Model::DynamicSchema::TableDefinition
  extend ActiveSupport::Concern
  include Grit::Core::Model::DynamicSchema::ValidIdentifier

  included do
    class_attribute :column_definitions_association, default: nil
    class_attribute :group_definition_association, default: nil
    class_attribute :schema_prefix, default: nil

    before_save :check_can_modify
    after_create :create_table
    after_update :rename_table
    before_destroy :check_can_modify
    after_destroy :drop_table

    validates :identifier, presence: true
    validates :identifier, length: { minimum: 2, maximum: 15 }
    validates :identifier, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :identifier, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }

    def check_can_modify
      raise "Cannot modify TableDefinition #{self.id}"
    end

    def table_name
      "#{self.schema_prefix}_#{self.send(self.group_definition_association).identifier}_#{self.identifier}"
    end

    def table_exists?
      ActiveRecord::Base.connection.table_exists? table_name
    end

    def quoted_table_name
      ActiveRecord::Base.connection.quote_table_name(table_name)
    end

    def column_definitions
      self.send(self.column_definitions_association)
    end

    def group_definition
      self.send(self.group_definition_association)
    end

    def create_table
      connection = ActiveRecord::Base.connection
      raise "table already exists" if table_exists?
      ActiveRecord::Base.transaction do
        connection.create_table table_name, id: false do |t|
          create_base_columns t
          create_implementation_columns t
          create_dynamic_columns t
        end
        create_foreign_keys
      end
    end

    def create_base_columns t
      t.bigint :id, primary_key: true, default: -> { "nextval('grit_seq'::regclass)" }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
    end

    def create_implementation_columns t
      implementation_column_definitions.each do |column|
        t.column column[:identifier], column[:data_type_name], null: !column[:required]
      end
    end

    def create_dynamic_columns t
      column_definitions.each do |column|
        t.column column.identifier, column.data_type.sql_name, null: !column.required
      end
    end

    def create_dynamic_column_foreign_keys
      connection = ActiveRecord::Base.connection
      column_definitions.each do |column|
        next unless column.data_type.is_entity
        connection.add_foreign_key table_name, column.data_type.table_name, column: column.identifier, name: "#{table_name}_#{column.identifier}"
      end
    end

    def create_implementation_column_foreign_keys
      connection = ActiveRecord::Base.connection
      implementation_column_definitions.each do |column|
        next unless column[:foreign_key]
        connection.add_foreign_key table_name, column[:foreign_key][:table_name], column: column[:identifier], name: "#{table_name}_#{column[:identifier]}"
      end
    end

    def create_foreign_keys
      create_implementation_column_foreign_keys
      create_dynamic_column_foreign_keys
    end

    def rename_dynamic_column_foreign_keys previous_table_name
      connection = ActiveRecord::Base.connection
      column_definitions.each do |column|
        next unless column.data_type.is_entity
        previous_constraint_name = "#{previous_table_name}_#{column.identifier}"
        connection.execute "ALTER TABLE #{table_name} RENAME CONSTRAINT #{previous_constraint_name} TO #{table_name}_#{column.identifier}"
      end
    end

    def rename_implementation_column_foreign_keys previous_table_name
      connection = ActiveRecord::Base.connection
      implementation_column_definitions.each do |column|
        next unless column[:foreign_key]
        previous_constraint_name = "#{previous_table_name}_#{column[:identifier]}"
        connection.execute "ALTER TABLE #{table_name} RENAME CONSTRAINT #{previous_constraint_name} TO #{table_name}_#{column[:identifier]}"
      end
    end

    def rename_foreign_keys previous_table_name
      rename_implementation_column_foreign_keys previous_table_name
      rename_dynamic_column_foreign_keys previous_table_name
    end

    def drop_table
      ActiveRecord::Base.connection.drop_table table_name, if_exists: true
    end

    def rename_table(group_definition_identifier_previously_was = nil)
      previous_group_definition_identifier = group_definition_identifier_previously_was || group_definition.identifier
      previous_identifier = identifier_previously_was || identifier
      previous_table_name = "#{schema_prefix}_#{previous_group_definition_identifier}_#{previous_identifier}"
      return if previous_table_name == table_name
      ActiveRecord::Base.connection.rename_table previous_table_name, table_name
      rename_foreign_keys previous_table_name
      ActiveRecord::Base.descendants.find { |m| m.table_name == previous_table_name }&.reset_column_information
    end

    def record_klass
      table_definition = self
      column_definitions = self.column_definitions.includes(:data_type)
      klass = Class.new(ActiveRecord::Base) do
        self.table_name = table_definition.table_name
        @table_definition = table_definition
        @column_definitions = column_definitions
        before_save :set_updater

        def set_updater
          current_user_login = Grit::Core::User.current.login
          self.created_by = current_user_login if self.new_record?
          self.updated_by = current_user_login
        end

        def self.detailed(params = nil)
          query = self.unscoped
            .select("#{self.table_name}.id")
            .select("#{self.table_name}.created_by")
            .select("#{self.table_name}.updated_by")
            .select("#{self.table_name}.created_at")
            .select("#{self.table_name}.updated_at")


          @column_definitions.each do |column|
            query = query.select("#{@table_definition.quoted_table_name}.#{column.quoted_identifier}")
            if column.data_type.is_entity
              entity_klass = column.data_type.model
              query = query
                .joins("LEFT OUTER JOIN #{column.data_type.table_name} #{column.identifier}__entities on #{column.identifier}__entities.id = #{@table_definition.quoted_table_name}.#{column.quoted_identifier}")
              for display_property in entity_klass.display_properties do
                query = query
                  .select("#{column.identifier}__entities.#{display_property[:name]} as #{ActiveRecord::Base.connection.quote_column_name("#{column.identifier}__#{display_property[:name]}")}") unless entity_klass.display_properties.nil?
              end
            end
          end
          query
        end

        def self.column_definition_properties(**args)
          @column_definitions.map do |column_definition|
            property = {
              name: column_definition.identifier,
              display_name: column_definition.name,
              description: column_definition.description,
              type: column_definition.data_type.is_entity ? "entity" : column_definition.data_type.name,
              required: column_definition.required,
              unique: false,
              entity: column_definition.data_type.entity_definition
            }
            property
          end
        end

        def self.entity_properties(**args)
          props = [
            {
              display_name: "Created at",
              name: "created_at",
              type: "datetime"
            },
            {
              display_name: "Created by",
              name: "created_by",
              type: "string"
            },
            {
              display_name: "Updated at",
              name: "updated_at",
              type: "datetime"
            },
            {
              display_name: "Updated by",
              name: "updated_by",
              type: "string"
            } ]

          props.concat(self.column_definition_properties)
        end

        def self.entity_field_from_property(property)
          if property[:type] == "entity"
            foreign_klass = property[:entity][:full_name].constantize
            foreign_klass_property = foreign_klass.display_properties[0]
            unless foreign_klass_property.nil?
              {
                **property,
                entity: {
                  **property[:entity],
                  column: property[:name],
                  display_column: foreign_klass_property[:name],
                  display_column_type: foreign_klass_property[:type]
                }
              }
            else
              {
                **property,
                entity: {
                  **property[:entity],
                  column: property[:name],
                  display_column: property[:entity][:primary_key],
                  display_column_type: property[:entity][:primary_key_type]
                }
              }
            end
          else
            property
          end
        end

        def self.entity_fields_from_properties(properties)
          properties.each_with_object([]) do |property, memo|
            next if [ "id", "created_at", "updated_at", "created_by", "updated_by" ].include?(property[:name])
            memo.push(entity_field_from_property(property))
          end
        end

        def self.entity_columns_from_properties(properties, default_hidden = [ "id", "created_at", "updated_at", "created_by", "updated_by" ])
          properties.each_with_object([]) do |property, memo|
            if property[:type] == "entity"
              foreign_klass = property[:entity][:full_name].constantize
              foreign_klass_display_properties = foreign_klass.display_properties
              foreign_klass_display_properties.each do |foreign_klass_display_property|
                memo.push({
                  **property,
                  display_name: foreign_klass_display_properties.length > 1 ? "#{property[:display_name]} #{foreign_klass_display_property[:display_name]}" : property[:display_name],
                  name: "#{property[:name]}__#{foreign_klass_display_property[:name]}",
                  entity: {
                    **property[:entity],
                    column: property[:name],
                    display_column: foreign_klass_display_property[:name],
                    display_column_type: foreign_klass_display_property[:type]
                  },
                  default_hidden: default_hidden.include?("#{property[:name]}__#{foreign_klass_display_property[:name]}")
                })
              end
            else
              memo.push({
                **property,
                default_hidden: default_hidden.include?(property[:name])
              })
            end
          end
        end

        def self.entity_fields(**args)
          self.entity_fields_from_properties(self.entity_properties(**args))
        end

        def self.entity_columns(**args)
          self.entity_columns_from_properties(self.entity_properties(**args))
        end
      end
      klass
    end
  end

  class_methods do
    def has_many_column_definitions column_definitions_association
      self.column_definitions_association = column_definitions_association
      has_many self.column_definitions_association, dependent: :destroy
    end

    def belongs_to_group_definition group_definition_association
      self.group_definition_association = group_definition_association
      belongs_to self.group_definition_association
    end

    def group_definition_id
      "#{self.group_definition_association.to_s}_id".to_sym
    end
  end
end
