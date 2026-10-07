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

# The rows of a committed dynamic table, as an ActiveRecord class.
# `TableDefinition#record_klass` returns a subclass bound to one table through
# `.for`; this class is abstract and has no table of its own.
#
# Saving stamps `created_by` and `updated_by` from `Grit::Core::User.current`,
# which raises outside a request unless `RequestStore.store["current_user"]`
# is set first, as the load set jobs do.
#
# Columns are reached through `record[:name]`, `read_attribute` and
# `write_attribute`, never methods: identifiers are user input and could clash
# with `save`, `format` and the like. They may also be SQL keywords (`group`,
# `order`), so quote them in any SQL written against the class. The Rails
# internals overridden below are pinned by specs.
#
# Constants are written in full: the compact class form gives no lexical scope.
class Grit::Core::Model::DynamicSchema::DynamicRecord < ActiveRecord::Base
  self.abstract_class = true
  # STI and optimistic locking would claim user columns named `type` and
  # `lock_version`.
  self.inheritance_column = nil
  self.lock_optimistically = false
  before_save :set_updater

  class << self
    # Set per table by `.for`; public so a held class can reach its definition.
    attr_reader :table_definition, :column_definitions, :generation
  end

  # A subclass for `table_definition`'s table, built after dropping the table
  # from the schema cache so the class always sees the table as it is now.
  def self.for(table_definition)
    # One string for both, since the cache is keyed by it.
    physical_table_name = table_definition.physical_table_name
    # Prepared statements are keyed by their SQL, so tagging every query with
    # the commit stops any connection reusing a plan from before a revert, when
    # the columns may have changed ("cached plan must not change result type").
    generation = "#{physical_table_name} #{table_definition.schema_definition.committed_at.utc.iso8601(6)}"
    ActiveRecord::Base.connection_pool.schema_cache.clear_data_source_cache!(physical_table_name)
    column_definitions = table_definition.ordered_column_definitions.to_a
    Class.new(self) do
      # First: anonymous classes have no `model_name`, which errors and cache
      # keys need.
      set_temporary_name "DynamicRecord(#{physical_table_name})"
      self.table_name = physical_table_name
      @table_definition = table_definition
      @column_definitions = column_definitions
      @generation = generation
    end
  end

  # Every query starts from it: `unscoped`, `all` and the `find` cache.
  def self.relation
    super.annotate(generation)
  end

  # Would generate a method per column; see above.
  def self.define_attribute_methods
    false
  end

  def self.timestamp_attributes_for_create
    [ "created_at" ]
  end

  def self.timestamp_attributes_for_update
    [ "updated_at" ]
  end

  private_class_method :relation, :timestamp_attributes_for_create, :timestamp_attributes_for_update

  def self.detailed(params = nil)
    query = self.unscoped
      .select("#{quoted_table_name}.id")
      .select("#{quoted_table_name}.created_by")
      .select("#{quoted_table_name}.updated_by")
      .select("#{quoted_table_name}.created_at")
      .select("#{quoted_table_name}.updated_at")

    # Not described by `column_definitions`, so selected here. All of them:
    # scopes get no `presented_when` keywords to gate on.
    table_definition.implementation_columns.each do |column|
      query = query.select("#{quoted_table_name}.#{ActiveRecord::Base.connection.quote_column_name(column.identifier)}")
      # Entity columns need the target joined for their `<name>__<display>` columns.
      next unless column.type == "entity" && column.entity
      entity_klass = column.entity[:full_name].constantize
      # Joined on the foreign key's target column, which may not be `id`.
      query = select_entity_display_columns(query, column.identifier, entity_klass.table_name, entity_klass, column.target_column)
    end

    column_definitions.each do |column|
      query = query.select("#{quoted_table_name}.#{ActiveRecord::Base.connection.quote_column_name(column.identifier)}")
      next unless column.data_type.is_entity
      query = select_entity_display_columns(query, column.identifier, column.data_type.table_name, column.data_type.model)
    end
    query
  end

  # Joins the target table as `<name>__`, the alias `GritEntityRecord#detailed_scope`
  # gives foreign key joins, and selects its display properties as
  # `<name>__<property>`, the grid columns `entity_columns` expands to.
  def self.select_entity_display_columns(query, name, target_table_name, entity_klass, target_column = Grit::Core::Model::DynamicSchema::TableDefinition::DEFAULT_FOREIGN_KEY_TARGET_COLUMN)
    display_properties = entity_klass.display_properties
    connection = ActiveRecord::Base.connection
    table_alias = "#{name}__"
    quoted_column = connection.quote_column_name(name)
    query = query.joins(<<~SQL.squish)
      LEFT OUTER JOIN #{connection.quote_table_name(target_table_name)} #{connection.quote_column_name(table_alias)}
      ON #{connection.quote_column_name(table_alias)}.#{connection.quote_column_name(target_column)} = #{quoted_table_name}.#{quoted_column}
    SQL
    display_properties.each do |display_property|
      query = query.select(
        "#{connection.quote_column_name(table_alias)}.#{connection.quote_column_name(display_property[:name])}" \
        " AS #{connection.quote_column_name("#{name}__#{display_property[:name]}")}"
      )
    end
    query
  end

  # Delegated so includers can override them on the definition.
  def self.implementation_column_properties(**args)
    table_definition.implementation_column_properties(**args)
  end

  def self.read_only_property_names
    table_definition.read_only_property_names
  end

  def self.column_definition_properties(**args)
    column_definitions.map do |column_definition|
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

    props.concat(self.implementation_column_properties(**args))
    props.concat(self.column_definition_properties(**args))
  end

  # `property[:entity]` may be nil when an includer overrides
  # `implementation_column_properties` past the validation.
  def self.entity_field_from_property(property)
    if property[:type] == "entity" && property[:entity]
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
    read_only = self.read_only_property_names
    properties.each_with_object([]) do |property, memo|
      next if read_only.include?(property[:name])
      memo.push(entity_field_from_property(property))
    end
  end

  def self.entity_columns_from_properties(properties, default_hidden = Grit::Core::Model::DynamicSchema::ValidIdentifier::DEFAULT_RESERVED_IDENTIFIERS)
    properties.each_with_object([]) do |property, memo|
      # Guarded for the same reason as `entity_field_from_property` above.
      if property[:type] == "entity" && property[:entity]
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
            # A declared `default_hidden` applies to entity columns too.
            default_hidden: property[:default_hidden] ||
              default_hidden.include?("#{property[:name]}__#{foreign_klass_display_property[:name]}")
          })
        end
      else
        memo.push({
          **property,
          default_hidden: property[:default_hidden] || default_hidden.include?(property[:name])
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

  def set_updater
    current_user_login = Grit::Core::User.current.login
    self["created_by"] = current_user_login if self.new_record?
    self["updated_by"] = current_user_login
  end

  # Both default to `send(name)`, which calls whatever method the column is
  # named after (`destroy`!). Also reads `detailed`'s `<name>__<display>` aliases.
  def read_attribute_for_serialization(name)
    has_attribute?(name) ? read_attribute(name) : super
  end

  def read_attribute_for_validation(name)
    has_attribute?(name) ? read_attribute(name) : super
  end

  # Rails reads `updated_at` through attribute methods, which this class
  # does not define. `cache_key` and `cache_key_with_version` call it.
  def cache_version
    return unless cache_versioning
    self["updated_at"]&.utc&.to_fs(cache_timestamp_format)
  end

  private

  # Stops `record.name` from resolving to a column.
  def attribute_method?(attr_name)
    attr_name == "id"
  end

  # Avoids `public_send("#{name}=")`, which would hit methods like `attributes=`.
  def _assign_attribute(name, value)
    return super unless self.class.has_attribute?(name)
    write_attribute(name, value)
  end
end
