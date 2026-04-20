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
  class AssayDataSheetColumn < ApplicationRecord
    include Grit::Core::GritEntityRecord
    include Grit::Core::Model::DangerousEdit

    belongs_to :assay_data_sheet_definition
    belongs_to :data_type, class_name: "Grit::Core::DataType"
    belongs_to :unit, class_name: "Grit::Core::Unit", optional: true
    has_many :data_table_columns, dependent: :destroy

    delegate :assay_model, to: :assay_data_sheet_definition

    display_column "name"

    entity_crud_with read: [],
    create: [ "Administrator", "AssayAdministrator" ],
    update: [ "Administrator", "AssayAdministrator" ],
    destroy: [ "Administrator", "AssayAdministrator" ]

    validates :name, uniqueness: { scope: :assay_data_sheet_definition_id, message: "has already been taken in this data sheet" }, length: { minimum: 1 }
    validates :safe_name, uniqueness: { scope: :assay_data_sheet_definition_id, message: "has already been taken in this data sheet" }, length: { minimum: 3, maximum: 30 }
    validates :safe_name, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :safe_name, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }
    validate :safe_name_not_conflict

    before_save :check_model_publication_status
    before_create :check_assay_data_sheet_definition_columns_count
    after_create :create_column_if_model_is_published
    after_update :sync_column
    before_destroy :check_model_publication_status
    before_destroy :remove_column

    def safe_name_not_conflict
      return unless self.safe_name_changed?
      if ActiveRecord::Base.instance_methods.include?(self.safe_name.to_sym) || [ "id", "created_at", "created_by", "updated_at", "updated_by", "experiment_id" ].include?(self.safe_name)
        errors.add("safe_name", "cannot be used as a safe name")
      end
    end

    def self.detailed(params = {})
      self.detailed_scope(params)
        .joins("LEFT OUTER JOIN grit_assays_assay_models ON grit_assays_assay_models.id = grit_assays_assay_data_sheet_definitions__.assay_model_id")
        .select("grit_assays_assay_models.id as assay_model_id")
        .select("grit_assays_assay_models.name as assay_model_id__name")
    end

    def create_column
      return unless assay_data_sheet_definition.table_exists?
      connection = ActiveRecord::Base.connection

      column = self
      type = (column.data_type.is_entity or column[:type].to_s == "integer") ? :bigint : column.data_type.sql_name

      connection.add_column assay_data_sheet_definition.table_name, column.safe_name, type, null: !column.required
      connection.add_foreign_key assay_data_sheet_definition.table_name, column.data_type.table_name, column: column.safe_name, name: "#{assay_data_sheet_definition.table_name}_#{column.safe_name}", if_not_exists: true if column.data_type.is_entity
      ActiveRecord::Base.descendants.find { |m| m.table_name == assay_data_sheet_definition.table_name }&.reset_column_information
    end

    def sync_column
      return unless assay_data_sheet_definition.table_exists?
      refresh_cache = false
      column = self
      connection = ActiveRecord::Base.connection
      if safe_name_previously_changed?
        connection.rename_column assay_data_sheet_definition.table_name, column.safe_name_previously_was, column.safe_name
        refresh_cache = true
      end
      if required_previously_changed?
        raise "Cannot require column with empty values" if column.required && assay_data_sheet_definition.sheet_record_klass.where(safe_name => nil).count().positive?
        connection.change_column_null assay_data_sheet_definition.table_name, column.safe_name, !column.required
        refresh_cache = true
      end
      if data_type_id_previously_changed?
        previous_data_type = Grit::Core::DataType.find(data_type_id_previously_was)
        raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows" if (previous_data_type.is_entity || column.data_type.is_entity) && assay_data_sheet_definition.sheet_record_klass.count(safe_name).positive?
        begin
          connection.remove_foreign_key assay_data_sheet_definition.table_name, column: column.safe_name, if_exists: true

          connection.change_column assay_data_sheet_definition.table_name, column.safe_name, column.data_type.sql_name, using: "#{connection.quote_column_name(column.safe_name)}::text::#{column.data_type.sql_name}"
          connection.add_foreign_key assay_data_sheet_definition.table_name, column.data_type.table_name, column: column.safe_name, name: "#{assay_data_sheet_definition.table_name}_#{column.safe_name}", if_not_exists: true if column.data_type.is_entity
          refresh_cache = true
        rescue ActiveRecord::InvalidForeignKey => e
          raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows"
        rescue ActiveRecord::StatementInvalid => e
          raise "Failed to convert #{previous_data_type.name} to #{column.data_type.name} because of conflicts in existing rows" if /invalid input syntax for type/.match?(e.to_s)
          raise e.to_s
        end
      end
      ActiveRecord::Base.descendants.find { |m| m.table_name == assay_data_sheet_definition.table_name }&.reset_column_information if refresh_cache
    end

    def remove_column
      return unless assay_data_sheet_definition.table_exists?
      connection = ActiveRecord::Base.connection
      connection.remove_column assay_data_sheet_definition.table_name, safe_name, if_exists: true
      ActiveRecord::Base.descendants.find { |m| m.table_name == assay_data_sheet_definition.table_name }&.reset_column_information
    end

    private
      def check_model_publication_status
        return if self.dangerous_edit?
        raise "Cannot modify columns of a published Assay Model" if assay_model.published?
      end

      def check_assay_data_sheet_definition_columns_count
        raise "A Data Sheet Definition cannot have more than 250 columns" if assay_data_sheet_definition.assay_data_sheet_columns.length >= 250
      end

      def create_column_if_model_is_published
        create_column if assay_model.published? && assay_data_sheet_definition.table_exists?
      end
  end
end
