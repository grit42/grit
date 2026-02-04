#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-assays.
#
# grit-assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-assays. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit::Assays
  class AssayDataSheetDefinition < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :assay_model
    has_many :assay_data_sheet_columns, dependent: :destroy
    has_many :experiment_data_sheet_record_load_set_blocks, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    before_save :check_model_publication_status

    def table_name
      "ds_#{id}"
    end

    def sheet_record_klass
      sheet = self
      klass = Class.new(ActiveRecord::Base) do
        self.table_name = sheet.table_name
        @sheet = sheet
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
            .select("#{self.table_name}.experiment_id")


          @sheet.assay_data_sheet_columns.each do |column|
            query = query.select("#{self.table_name}.#{column.safe_name}")
            if column.data_type.is_entity
              entity_klass = column.data_type.model
              query = query
                .joins("LEFT OUTER JOIN #{column.data_type.table_name} #{column.safe_name}__entities on #{column.safe_name}__entities.id = #{@sheet.table_name}.#{column.safe_name}")
              for display_property in entity_klass.display_properties do
                query = query
                  .select("#{column.safe_name}__entities.#{display_property[:name]} as #{column.safe_name}__#{display_property[:name]}") unless entity_klass.display_properties.nil?
              end
            end
          end
          query
        end

        def self.assay_data_sheet_definition_properties(**args)
          assay_data_sheet_definition = Grit::Assays::AssayDataSheetDefinition.find(@sheet.id)

          AssayDataSheetColumn.where(assay_data_sheet_definition_id: @sheet.id).order("sort ASC NULLS LAST").map do |definition_column|
            property = {
              name: definition_column.safe_name,
              display_name: definition_column.name,
              description: definition_column.description,
              type: definition_column.data_type.is_entity ? "entity" : definition_column.data_type.name,
              required: definition_column.required,
              unique: false,
              entity: definition_column.data_type.entity_definition
            }
            property
          end
        end

        def self.entity_properties(**args)
          props = [
            {
              display_name: "Created at",
              name: "created_at",
              type: "datetime",
            },
            {
              display_name: "Created by",
              name: "created_by",
              type: "string",
            },
            {
              display_name: "Updated at",
              name: "updated_at",
              type: "datetime",
            },
            {
              display_name: "Updated by",
              name: "updated_by",
              type: "string",
            }]

          if args[:with_experiment_id]
            props.push({
              display_name: "Experiment",
              name: "experiment_id",
              type: "entity",
              entity: {
                full_name: "Grit::Assays::Experiment",
                name: "Experiment",
                path: "grit/assays/experiments",
                primary_key: "id",
                primary_key_type: "integer",
              }
            })
          end

          props.concat(self.assay_data_sheet_definition_properties.filter { |p| p[:name] != "experiment_id" })
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

    def create_table
      foreign_key_colums = []
      connection = ActiveRecord::Base.connection
      connection.create_table table_name, id: false, if_not_exists: true do |t|
        t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
        t.string :created_by, limit: 30, null: false, default: "SYSTEM"
        t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
        t.string :updated_by, limit: 30
        t.datetime :updated_at
        t.references :experiment, null: false, foreign_key: { name: "#{table_name}_experiments", to_table: "grit_assays_experiments" }

        assay_data_sheet_columns.each do |column|
          if column.data_type.is_entity
            t.column column.safe_name, :bigint, null: !column.required
            foreign_key_colums.push column
          elsif column.data_type.name == "integer"
            t.column column.safe_name, :numeric, precision: 1000, scale: 0, null: !column.required
          elsif column.data_type.name == "decimal"
            t.column column.safe_name, :numeric, null: !column.required
          else
            t.column column.safe_name, column.data_type.sql_name, null: !column.required
          end
        end
      end

      foreign_key_colums.each do |column|
        connection.add_foreign_key table_name, column.data_type.table_name, column: column.safe_name, name: "#{table_name}_#{column.safe_name}", if_not_exists: true
      end
    end

    def drop_table
      ActiveRecord::Base.connection.drop_table table_name, if_exists: true
    end

    private
      def check_model_publication_status
        raise "Cannot modify data sheet definitions of a published Assay Model" if assay_model.publication_status.name === "Published"
      end
  end
end
