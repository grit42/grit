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
  class Assay < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :assay_model
    has_many :assay_metadata, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    def self.entity_properties(**args)
      assay_id = args[:assay_id]

      metadata_definitions_query = Grit::Assays::AssayMetadataDefinition.unscoped

      unless assay_id.nil?
        metadata_definitions_query = metadata_definitions_query
        .joins("LEFT OUTER JOIN grit_assays_assay_model_metadata grit_assays_assay_model_metadata__ on grit_assays_assay_model_metadata__.assay_metadata_definition_id = #{Grit::Assays::AssayMetadataDefinition.table_name}.id")
        .joins("JOIN grit_assays_assays grit_assays_assays__ on grit_assays_assays__.assay_model_id = grit_assays_assay_model_metadata__.assay_model_id and grit_assays_assays__.id = #{assay_id}")
      end

      assay_model_properties = metadata_definitions_query.all.map do |definition|
        {
          name: definition.safe_name,
          display_name: definition.name,
          type: "entity",
          limit: nil,
          required: true,
          unique: false,
          default: nil,
          entity: {
            name: definition.name,
            full_name: "Grit::Assays::VocabularyItem",
            path: "grit/assays/vocabulary_items",
            primary_key: "id",
            primary_key_type: "integer",
            filters: [ {
              active: true,
              id: "vocabulary_id",
              column: "id",
              property: "vocabulary_id",
              property_type: "integer",
              operator: "eq",
              type: "integer",
              value: definition.vocabulary_id
            } ]
          },
          disabled: false,
          metadata_definition_id: definition.id
        }
      end

      [ *self.db_properties, *Grit::Assays::AssayModel.db_properties.filter { |p| p[:name] == "assay_type_id" }, *assay_model_properties ]
    end

    def self.entity_fields(**args)
      self.entity_fields_from_properties(self.entity_properties(**args)).reject { |f| f[:name] == "assay_type_id" }.map { |f| { **f, metadata_definition_id: f[:metadata_definition_id] } }
    end

    def self.entity_columns(**args)
      self.entity_columns_from_properties(self.entity_properties(**args))
    end

    def self.detailed(params = nil)
      query = self.unscoped
      .select("grit_assays_assays.id")
      .select("grit_assays_assays.created_by")
      .select("grit_assays_assays.updated_by")
      .select("grit_assays_assays.created_at")
      .select("grit_assays_assays.updated_at")
      .select("grit_assays_assays.name")
      .select("grit_assays_assays.description")
      .select("grit_assays_assays.assay_model_id")
      .select("grit_assays_assays.publication_status_id")
      .select("grit_assays_assay_models__.name as assay_model_id__name")
      .select("grit_assays_assay_types__.id as assay_type_id")
      .select("grit_assays_assay_types__.name as assay_type_id__name")
      .select("grit_core_publication_statuses__.name as publication_status_id__name")
      .joins("LEFT OUTER JOIN grit_assays_assay_models grit_assays_assay_models__ ON grit_assays_assays.assay_model_id = grit_assays_assay_models__.id")
      .joins("LEFT OUTER JOIN grit_assays_assay_types grit_assays_assay_types__ ON grit_assays_assay_models__.assay_type_id = grit_assays_assay_types__.id")
      .joins("LEFT OUTER JOIN grit_core_publication_statuses grit_core_publication_statuses__ ON grit_assays_assays.publication_status_id = grit_core_publication_statuses__.id")

      Grit::Assays::AssayMetadataDefinition.unscoped.each do |metadata_definition|
        query = query
        .joins("LEFT OUTER JOIN grit_assays_assay_model_metadata grit_assays_assay_model_metadata__#{metadata_definition.id} on grit_assays_assay_model_metadata__#{metadata_definition.id}.assay_metadata_definition_id = #{metadata_definition.id} and grit_assays_assay_model_metadata__#{metadata_definition.id}.assay_model_id = grit_assays_assays.assay_model_id")
        .joins("LEFT OUTER JOIN grit_assays_assay_metadata grit_assays_assay_metadata__#{metadata_definition.id} ON grit_assays_assay_metadata__#{metadata_definition.id}.assay_id = grit_assays_assays.id AND grit_assays_assay_metadata__#{metadata_definition.id}.assay_model_metadatum_id = grit_assays_assay_model_metadata__#{metadata_definition.id}.id")
        .joins("LEFT OUTER JOIN grit_assays_vocabulary_items grit_assays_vocabulary_items__#{metadata_definition.id} ON grit_assays_vocabulary_items__#{metadata_definition.id}.id = grit_assays_assay_metadata__#{metadata_definition.id}.vocabulary_item_id")
        .select("grit_assays_vocabulary_items__#{metadata_definition.id}.id as #{metadata_definition.safe_name}")
        .select("grit_assays_vocabulary_items__#{metadata_definition.id}.name as #{metadata_definition.safe_name}__name")
      end
      query
    end

    def self.published(params = nil)
      self.detailed(params)
      .joins("LEFT OUTER JOIN grit_core_publication_statuses grit_core_publication_statuses__models ON grit_assays_assay_models__.publication_status_id = grit_core_publication_statuses__.id")
      .where("grit_core_publication_statuses__.name = 'Published' and grit_core_publication_statuses__models.name = 'Published'")
    end
  end
end
