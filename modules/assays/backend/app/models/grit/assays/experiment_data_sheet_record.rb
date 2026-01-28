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
  class ExperimentDataSheetRecord < ApplicationRecord
    include Grit::Core::GritEntityRecord

    entity_crud_with create: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      read: [],
      update: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      destroy: [ "Administrator", "AssayAdministrator", "AssayUser" ]

    def self.sheet_record_klass(assay_data_sheet_definition_id)
      sheet = Grit::Assays::AssayDataSheetDefinition.includes(assay_data_sheet_columns: [ :data_type ]).find(assay_data_sheet_definition_id)
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
          [
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
            },
            *self.assay_data_sheet_definition_properties.filter { |p| p[:name] != "experiment_id" }
          ]
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

      def self.create(params)
        params = params.as_json
        assay_data_sheet_definition = AssayDataSheetDefinition.find(params["assay_data_sheet_definition_id"])
        values = assay_data_sheet_definition.assay_data_sheet_columns.each_with_object({ experiment_id: params["experiment_id"] }) do |column, hash|
          hash[column.safe_name] = params[column.safe_name]
        end
        sheet_record_klass(params["assay_data_sheet_definition_id"]).create!(values)
      end

      def self.update(params)
        params = params.as_json
        assay_data_sheet_definition = AssayDataSheetDefinition.find(params["assay_data_sheet_definition_id"])
        record = sheet_record_klass(params["assay_data_sheet_definition_id"]).find(params["id"])
        values = assay_data_sheet_definition.assay_data_sheet_columns.each_with_object({}) do |column, hash|
          hash[column.safe_name] = params[column.safe_name]
        end
        record.update!(values)
        record
      end

      def self.definition_properties(**args)
        assay_data_sheet_definition = Grit::Assays::AssayDataSheetDefinition.find(args[:assay_data_sheet_definition_id])

        AssayDataSheetColumn.where(assay_data_sheet_definition_id: assay_data_sheet_definition.id).order("sort ASC NULLS LAST").map do |definition_column|
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

      def self.entity_fields(**args)
        sheet_record_klass(args[:assay_data_sheet_definition_id]).entity_fields
      end

      def self.entity_columns(**args)
        sheet_record_klass(args[:assay_data_sheet_definition_id]).entity_columns
      end

      def self.by_experiment(params)
        raise "No experiment_id specified" if params["experiment_id"].nil?
        raise "No assay_data_sheet_definition_id specified" if params["assay_data_sheet_definition_id"].nil?

        sheet_record_klass(params["assay_data_sheet_definition_id"]).detailed(params).where(experiment_id: params[:experiment_id])
      end

      def self.by_assay_data_sheet_definition(params)
        raise "No assay_data_sheet_definition_id specified" if params["assay_data_sheet_definition_id"].nil?
        klass = sheet_record_klass(params["assay_data_sheet_definition_id"])
        klass.detailed(params)
          .joins("JOIN grit_assays_experiments grit_assays_experiments__ on grit_assays_experiments__.id = #{klass.table_name}.experiment_id")
          .where("grit_assays_experiments__.publication_status_id" => Grit::Core::PublicationStatus.find_by(name: "Published").id)
      end

      def self.detailed(params = nil)
        params = params.as_json
        raise "No assay_data_sheet_definition_id specified" if params["assay_data_sheet_definition_id"].nil?
        sheet_record_klass(params["assay_data_sheet_definition_id"]).detailed(params)
      end

      def self.by_load_set(params)
        raise "Load set id must be specified" if !params or !params[:load_set_id]
        record_load_set = Grit::Assays::ExperimentDataSheetRecordLoadSet.find_by(load_set_id: params[:load_set_id])
        assay_data_sheet_definition = Grit::Assays::AssayDataSheetDefinition.find(record_load_set.assay_data_sheet_definition_id)
        self.detailed(record_load_set.as_json).where("#{assay_data_sheet_definition.table_name}.id IN (SELECT record_id FROM grit_core_load_set_loaded_records WHERE grit_core_load_set_loaded_records.load_set_id = ?)", params[:load_set_id].to_i).order(:created_at)
      end
  end
end
