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
    has_many :experiment_data_sheet_record_load_sets, dependent: :destroy

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
