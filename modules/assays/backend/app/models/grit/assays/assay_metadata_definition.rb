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
  class AssayMetadataDefinition < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :vocabulary, class_name: "Grit::Core::Vocabulary"
    has_many :experiment_metadata, dependent: :destroy
    has_many :experiment_metadata_template_metadata, dependent: :destroy

    before_save :check_in_use
    before_destroy :check_required_in_assay_model

    display_column "name"

    validates :safe_name, uniqueness: true, length: { minimum: 3, maximum: 30 }
    validates :safe_name, format: { with: /\A[a-z_]{2}/, message: "should start with two lowercase letters or underscores" }
    validates :safe_name, format: { with: /\A[a-z0-9_]*\z/, message: "should contain only lowercase letters, numbers and underscores" }
    validate :safe_name_not_conflict

    def safe_name_not_conflict
      return unless self.safe_name_changed?
      if Grit::Assays::Experiment.new.respond_to?(self.safe_name)
        errors.add("safe_name", "cannot be used as a safe name")
      end
    end

    def self.by_assay_model(params)
      raise "No assay model provided" if params["assay_model_id"].nil?

      detailed(params)
      .joins("JOIN grit_assays_assay_model_metadata grit_assays_assay_model_metadata__ on grit_assays_assay_model_metadata__.assay_metadata_definition_id = grit_assays_assay_metadata_definitions.id and grit_assays_assay_model_metadata__.assay_model_id = #{params["assay_model_id"]}")
      .select("grit_assays_assay_model_metadata__.id as assay_model_metadatum_id")
    end

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    private

      def check_in_use
        return if new_record?
        in_use = Grit::Assays::AssayModelMetadatum.unscoped.where(assay_metadata_definition_id: id).count(:all).positive?
        in_use ||= ExperimentMetadatum.unscoped.where(assay_metadata_definition_id: id).count(:all).positive?
        raise "Cannot modify a metadata definition already in use" if in_use
      end

      def check_required_in_assay_model
        required_in_assay_model = Grit::Assays::AssayModelMetadatum.unscoped.where(assay_metadata_definition_id: id).count(:all).positive?
        raise "'#{self.name}' is required in at least one assay model" if required_in_assay_model
      end
  end
end
