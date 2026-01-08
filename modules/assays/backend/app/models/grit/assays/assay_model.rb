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
  class AssayModel < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :assay_type
    belongs_to :publication_status, class_name: "Grit::Core::PublicationStatus"
    has_many :assays, dependent: :destroy
    has_many :assay_model_metadata, dependent: :destroy
    has_many :assay_data_sheet_definitions, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    before_update :maintain_data_sheet_tables

    def self.published(params)
      self.detailed(params).where("grit_core_publication_statuses__.name = 'Published'")
    end

    def maintain_data_sheet_tables # TODO: remove
      if publication_status.name == "Draft"
        drop_tables
      else
        create_tables
      end
    end

    private

    def create_tables
      foreign_keys = []
      connection = ActiveRecord::Base.connection
      assay_data_sheet_definitions.each do |sheet|
        connection.create_table sheet.table_name, id: false, if_not_exists: true do |t|
          t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
          t.string :created_by, limit: 30, null: false, default: "SYSTEM"
          t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
          t.string :updated_by, limit: 30
          t.datetime :updated_at
          t.references :experiment, null: false, foreign_key: { name: "#{sheet.table_name}_experiments", to_table: "grit_assays_experiments" }

          sheet.assay_data_sheet_columns.each do |column|
            if column.data_type.is_entity
              t.column column.safe_name, :bigint, null: !column.required
              foreign_keys.push [sheet, column]
            else
              t.column column.safe_name, column.data_type.name, null: !column.required
            end
          end
        end
      end

      foreign_keys.each do |fk|
        sheet = fk[0]
        column = fk[1]
        connection.add_foreign_key sheet.table_name, column.data_type.table_name, column: column.safe_name, name: "#{sheet.table_name}_#{column.safe_name}", if_not_exists: true
      end
    end

    def drop_tables
      connection = ActiveRecord::Base.connection
      assay_data_sheet_definitions.each do |sheet|
        connection.drop_table sheet.table_name, if_exists: true
      end
    end
  end
end
