module Grit::Assays
  class Analysis < ApplicationRecord
    include Grit::Core::GritEntityRecord

    display_column "name"

    entity_crud_with read: [ "read:system" ], write: [ "write:analysis" ]

    belongs_to :assay_data_sheet_definition
    has_many :analysis_experiments, dependent: :destroy

    @no_show = [
      "plots",
      "filters"
    ]

    def self.entity_properties(**args)
      @entity_properties ||= self.db_properties.reject { |p| @no_show.include?(p[:name]) }
    end

    def self.entity_columns(**args)
      @entity_columns ||= self.entity_columns_from_properties(self.entity_properties)
    end

    def self.entity_fields(**args)
      @entity_fields ||= self.entity_fields_from_properties(self.entity_properties)
    end
  end
end
