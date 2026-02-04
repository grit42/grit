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

    before_destroy :delete_records
    before_save :check_publication_status

    belongs_to :assay_model
    belongs_to :publication_status, class_name: "Grit::Core::PublicationStatus"
    has_many :experiment_metadata, dependent: :destroy
    has_many :experiment_data_sheet_record_load_sets, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      update: [ "Administrator", "AssayAdministrator", "AssayUser" ],
      destroy: [ "Administrator", "AssayAdministrator", "AssayUser" ]

    def set_metadata_values(params)
      success = true
      experiment_metadata = self.experiment_metadata
      AssayMetadataDefinition.all.each do |md|
        experiment_metadatum = experiment_metadata.find { |em| em.assay_metadata_definition_id == md.id }
        if (params[md.safe_name].nil? || params[md.safe_name].blank?) && !experiment_metadatum.nil?
          begin
            experiment_metadatum.destroy!
          rescue
            errors.add(md.safe_name, "could not remove metadata value")
            success = false
          end
        elsif !(params[md.safe_name].nil? || params[md.safe_name].blank?) && !experiment_metadatum.nil?
          begin
            experiment_metadatum.update!(vocabulary_item_id: params[md.safe_name])
          rescue
            errors.add(md.safe_name, "could not update metadata value")
            success = false
          end
        elsif !(params[md.safe_name].nil? || params[md.safe_name].blank?) && experiment_metadatum.nil?
          begin
            ExperimentMetadatum.create!({ experiment_id: id, assay_metadata_definition_id: md.id, vocabulary_id: md.vocabulary_id, vocabulary_item_id: params[md.safe_name] })
          rescue
            errors.add(md.safe_name, "could not set metadata value")
            success = false
          end
        end
      end
      success
    end

    def self.create(params)
      ActiveRecord::Base.transaction do
        @record = Grit::Assays::Experiment.new({ name: params[:name], description: params[:description], assay_model_id: params[:assay_model_id] })

        if @record.save
          @record.set_metadata_values(params)
        end
        @record
      end
    end

    def self.detailed(params = nil)
      query = detailed_scope(params)
        .joins("JOIN grit_assays_assay_types grit_assays_assay_types__ on grit_assays_assay_types__.id = grit_assays_assay_models__.assay_type_id")
        .select("grit_assays_assay_types__.id as assay_type_id")
        .select("grit_assays_assay_types__.name as assay_type_id__name")
      AssayMetadataDefinition.all.each do |md|
        query = query
          .joins("LEFT OUTER JOIN #{ExperimentMetadatum.table_name} #{md.safe_name} ON #{md.safe_name}.assay_metadata_definition_id = #{md.id} AND #{md.safe_name}.experiment_id = #{self.table_name}.id")
          .joins("LEFT OUTER JOIN #{Grit::Core::VocabularyItem.table_name} vi_#{md.safe_name} ON vi_#{md.safe_name}.id = #{md.safe_name}.vocabulary_item_id")
          .select("vi_#{md.safe_name}.id as #{md.safe_name}")
          .select("vi_#{md.safe_name}.name as #{md.safe_name}__name")
      end
      query
    end

    def self.published(params = nil)
      self.detailed.where("grit_core_publication_statuses__.name = ?", "Published")
    end

    def self.entity_properties(**args)
      @entity_properties ||= self.db_properties.filter { |p| p[:name] != "plots" }
    end

    def self.metadata_properties(**args)
      assay_model_metadata = []

      if args[:experiment_id]
        assay_model_metadata = AssayModelMetadatum.where(assay_model_id: Experiment.find_by(id: args[:experiment_id])&.assay_model_id).all
      elsif args[:assay_model_id]
        assay_model_metadata = AssayModelMetadatum.where(assay_model_id: args[:assay_model_id]).all
      end

      metadata_properties = AssayMetadataDefinition.all.map do |md|
        {
          name: md.safe_name,
          display_name: md.name,
          type: "entity",
          limit: nil,
          required: assay_model_metadata.any? { |amm| amm.assay_metadata_definition_id == md.id },
          unique: false,
          default: nil,
          entity: {
            name: md.name,
            full_name: "Grit::Core::VocabularyItem",
            path: "grit/core/vocabularies/#{md.vocabulary_id}/vocabulary_items",
            primary_key: "id",
            primary_key_type: "integer"
          },
          disabled: false,
          metadata_definition_id: md.id
        }
      end
    end

    def self.entity_fields(**args)
      self.entity_fields_from_properties([*self.entity_properties(**args), *self.metadata_properties(**args)])
    end

    def self.entity_columns(**args)
      self.entity_columns_from_properties([*self.entity_properties(**args), *self.metadata_properties(**args)])
    end

    def delete_records
      assay_model.assay_data_sheet_definitions.each do |ds|
        klass = ds.sheet_record_klass
        klass.destroy_by(experiment_id: id) if klass.table_exists?
      end
    end

    private
      def check_publication_status
        return if publication_status_changed?
        raise "Cannot modify a published Experiment" if publication_status.name === "Published"
      end
  end
end
