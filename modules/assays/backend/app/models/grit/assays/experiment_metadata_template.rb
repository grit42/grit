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
  class ExperimentMetadataTemplate < ApplicationRecord
    include Grit::Core::GritEntityRecord

    has_many :experiment_metadata_template_metadata, dependent: :destroy

    display_column "name"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    def set_metadata_values(params)
      success = true
      experiment_metadata_template_metadata = self.experiment_metadata_template_metadata
      AssayMetadataDefinition.all.each do |md|
        experiment_metadata_template_metadatum = experiment_metadata_template_metadata.find { |em| em.assay_metadata_definition_id == md.id }
        if (params[md.safe_name].nil? || params[md.safe_name].blank?) && !experiment_metadata_template_metadatum.nil?
          begin
            experiment_metadata_template_metadatum.destroy!
          rescue StandardError => e
            logger.info e.to_s
            logger.info e.backtrace.join("\n")
            errors.add(md.safe_name, "could not remove metadata value")
            success = false
          end
        elsif !(params[md.safe_name].nil? || params[md.safe_name].blank?) && !experiment_metadata_template_metadatum.nil?
          begin
            experiment_metadata_template_metadatum.update!(vocabulary_item_id: params[md.safe_name])
          rescue StandardError => e
            logger.info e.to_s
            logger.info e.backtrace.join("\n")
            errors.add(md.safe_name, "could not update metadata value")
            success = false
          end
        elsif !(params[md.safe_name].nil? || params[md.safe_name].blank?) && experiment_metadata_template_metadatum.nil?
          begin
            ExperimentMetadataTemplateMetadatum.create!({ experiment_metadata_template_id: id, assay_metadata_definition_id: md.id, vocabulary_id: md.vocabulary_id, vocabulary_item_id: params[md.safe_name] })
          rescue StandardError => e
            logger.info e.to_s
            logger.info e.backtrace.join("\n")
            errors.add(md.safe_name, "could not set metadata value")
            success = false
          end
        end
      end
      success
    end

    def self.detailed(params = nil)
      query = detailed_scope(params)
      AssayMetadataDefinition.all.each do |md|
        query = query
          .joins("LEFT OUTER JOIN #{ExperimentMetadataTemplateMetadatum.table_name} #{md.safe_name} ON #{md.safe_name}.assay_metadata_definition_id = #{md.id} AND #{md.safe_name}.experiment_metadata_template_id = #{self.table_name}.id")
          .joins("LEFT OUTER JOIN #{Grit::Core::VocabularyItem.table_name} vi_#{md.safe_name} ON vi_#{md.safe_name}.id = #{md.safe_name}.vocabulary_item_id")
          .select("vi_#{md.safe_name}.id as #{md.safe_name}")
          .select("vi_#{md.safe_name}.name as #{md.safe_name}__name")
      end
      query
    end

    def self.published(params = nil)
      self.detailed.where("grit_core_publication_statuses__.name = ?", "Published")
    end
  end
end
