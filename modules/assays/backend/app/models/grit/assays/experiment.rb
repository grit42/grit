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
  class Experiment < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :assay
    delegate :assay_model, to: :assay
    has_many :experiment_data_sheets, dependent: :destroy

    display_column "name"

    def self.create(params)
      ActiveRecord::Base.transaction do
        @record = Grit::Assays::Experiment.new(params)

        if @record.save
          Grit::Assays::ExperimentDataSheet.create!(@record.assay_model.assay_data_sheet_definitions.map { |d| { experiment_id: @record.id, assay_data_sheet_definition_id: d.id } })
        end
        @record
      end
    end

    entity_crud_with create: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      read: [],
      update: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      destroy: [ "Administrator", "AssayAdministrator", "AssayUser" ]


    def self.entity_properties(**args)
      @entity_properties ||= self.db_properties.filter { |p| p[:name] != "plots" }
    end

    def self.entity_fields(**args)
      @entity_fields ||= self.entity_fields_from_properties(self.entity_properties)
    end

    def self.entity_columns(**args)
      @entity_columns ||= self.entity_columns_from_properties(self.entity_properties)
    end
  end
end
