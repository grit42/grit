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
  class ExperimentMetadataTemplateMetadatum < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :assay_metadata_definition
    belongs_to :experiment_metadata_template
    belongs_to :vocabulary, class_name: "Grit::Core::Vocabulary"
    belongs_to :vocabulary_item, class_name: "Grit::Core::VocabularyItem"

    entity_crud_with read: [],
      create: [ "Administrator", "AssayAdministrator" ],
      update: [ "Administrator", "AssayAdministrator" ],
      destroy: [ "Administrator", "AssayAdministrator" ]

    after_destroy :destroy_template_if_empty

    private

    def destroy_template_if_empty
      experiment_metadata_template.destroy unless experiment_metadata_template.experiment_metadata_template_metadata.length.positive?
    end
  end
end
