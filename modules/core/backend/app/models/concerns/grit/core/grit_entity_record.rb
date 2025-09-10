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

require "grit/core/entity_mapper"

module Grit::Core::GritEntityRecord
  extend ActiveSupport::Concern

  included do
    @db_foreign_keys = nil
    @db_indexes = nil
    @unique_properties = nil
    @db_properties = nil

    @display_columns = nil
    @entity_crud = { create: nil, read: nil, update: nil, destroy: nil }

    @entity_properties = nil
    @entity_fields = nil
    @entity_columns = nil
    @display_properties = nil

    begin
      ActiveRecord::Base.connection.indexes(self.table_name).each do |index|
        validates index.columns[0], uniqueness: index.columns.length > 1 ? { scope: index.columns[1..] } : true, allow_nil: !index.nulls_not_distinct if index.unique
      end

      self.columns.each do |column|
        next if [ "id", "created_at", "created_by", "updated_at", "updated_by" ].include?(column.name)
        validates column.name, presence: true unless column.null || column.sql_type_metadata.type == :boolean
        validates column.name, inclusion: { in: [ true, false ] } if column.sql_type_metadata.type == :boolean && !column.null
        validates column.name, length: { maximum: column.sql_type_metadata.limit } unless column.sql_type_metadata.limit.nil? or ![ :string, :text ].include?(column.sql_type_metadata.type)
      end
    rescue
    end

    validate :numbers_in_range

    def numbers_in_range
      self.class.columns.each do |column|
        next if ![ :integer, :float ].include?(column.sql_type_metadata.type) or column.sql_type_metadata.sql_type.end_with? "[]"

        if column.sql_type_metadata.type == :integer && self[column.name].present? && self[column.name].to_i.bit_length > column.sql_type_metadata.limit * 8
          errors.add(column.name, "is out of range")
        elsif column.sql_type_metadata.type == :float && self[column.name].present?
          errors.add(column.name, "is out of range") if self[column.name].to_f.infinite?
          errors.add(column.name, "is not a number") if self[column.name].to_f.nan?
        end
      end
    end

    before_save :set_updater

    def set_updater
      unless self.class.name == "Grit::Core::User"
        current_user_login = Grit::Core::User.current.login
        self.created_by = current_user_login if self.new_record?
        self.updated_by = current_user_login
      end
    end
  end

  # The methods added inside the class_methods block (or, ClassMethods module)
  # become the class methods on the including class.
  class_methods do
    def foreign_keys
      @db_foreign_keys ||= ActiveRecord::Base.connection.foreign_keys(self.table_name)
    end

    def indexes
      @db_indexes ||= ActiveRecord::Base.connection.indexes(self.table_name)
    end

    def unique_index_columns
      indexes.select { |index| index.unique }.map { |index| index.columns }.flatten
    end

    def unique_rails_validated_columns
      self._validators.select { |key, value| value.any? { |item| item.is_a?(ActiveRecord::Validations::UniquenessValidator) } }.keys.map(&:to_s)
    end

    def unique_properties
      @unique_properties ||= [ *unique_index_columns, *unique_rails_validated_columns ].uniq
    end

    def db_properties
      @db_properties ||= self.columns.map do |column|
        foreign_key = self.foreign_keys.find { |key| key.options[:column] == column.name }
        property = {
          name: column.name,
          display_name: column.name.humanize,
          description: column.comment,
          type: foreign_key.nil? ? column.sql_type_metadata.type : "entity",
          limit: column.sql_type_metadata.limit,
          required: !column.null,
          unique: unique_properties.include?(column.name.to_s)
        }
        unless foreign_key.nil?
          foreign_key_model_name = Grit::Core::EntityMapper.table_to_model_name(foreign_key.to_table)
          property[:entity] = {
            full_name: foreign_key_model_name,
            name: foreign_key_model_name.demodulize,
            path: foreign_key_model_name.underscore.pluralize,
            primary_key: foreign_key.options[:primary_key],
            primary_key_type: column.sql_type_metadata.type
          }
        end
        property
      end
    end

    def display_properties
      @display_properties ||= @display_columns&.map { |name| self.db_properties.find { |p| p[:name] == name } } || []
    end

    def entity_properties(**args)
      @entity_properties ||= self.db_properties
    end

    def entity_field_from_property(property)
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

    def entity_fields_from_properties(properties)
      properties.each_with_object([]) do |property, memo|
        next if [ "id", "created_at", "updated_at", "created_by", "updated_by" ].include?(property[:name])
        memo.push(entity_field_from_property(property))
      end
    end

    def entity_fields(**args)
      @entity_fields ||= self.entity_fields_from_properties(self.db_properties)
    end

    def entity_columns_from_properties(properties, default_hidden = [ "id", "created_at", "updated_at", "created_by", "updated_by" ])
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

    def entity_columns(**args)
      @entity_columns ||= self.entity_columns_from_properties(self.db_properties)
    end

    def detailed(params = nil)
      query = self.from(self.table_name)
      self.columns.each do |column|
        query = query.select("#{self.table_name}.#{column.name}")
        query = query.order(Arel.sql("#{self.table_name}.sort ASC NULLS LAST")) if column.name == "sort"
      end

      self.foreign_keys.each do |foreign_key, memo|
        foreign_key_model = Grit::Core::EntityMapper.table_to_model_name(foreign_key.to_table).constantize
        query = query.joins("LEFT OUTER JOIN #{foreign_key.to_table} #{foreign_key.to_table}__ ON #{foreign_key.to_table}__.#{foreign_key.options[:primary_key]} = #{self.table_name}.#{foreign_key.options[:column]}")
        foreign_key_model.display_properties.each do |property|
          query = query.select("#{foreign_key.to_table}__.#{property[:name]} as #{foreign_key.options[:column]}__#{property[:name]}")
        end
      end
      query
    end

    def by_load_set(params)
      raise "Load set id must be specified" if !params or !params[:load_set_id]
      self.detailed.where("#{self.table_name}.id IN (SELECT record_id FROM grit_core_load_set_loaded_records WHERE grit_core_load_set_loaded_records.load_set_id = ?)", params[:load_set_id].to_i).order(:created_at)
    end

    def entity_crud
      @entity_crud
    end

    def loader_find_by!(prop, value, **args)
      find_by!({ prop => value })
    end

    private
    def display_columns(display_columns)
      @display_columns = display_columns.is_a?(String) ? [ display_columns ] : display_columns
    end

    alias_method :display_column, :display_columns

    def entity_crud_with(create: nil, read: nil, update: nil, destroy: nil)
      @entity_crud = {
        create: create,
        read: read,
        update: update,
        destroy: destroy
      }
    end

    def entity_table_with(default_visible: nil, default_hidden: nil)
      @entity_table_columns = { default_visible: default_visible, default_hidden: default_hidden }
    end
  end
end
