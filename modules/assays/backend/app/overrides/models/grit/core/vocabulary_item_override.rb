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

Grit::Core::VocabularyItem.class_eval do
  has_many :experiment_metadata_template_metadata, dependent: :destroy, class_name: "Grit::Assays::ExperimentMetadataTemplateMetadatum"

  before_destroy :check_experiment_metadata

  def check_experiment_metadata
    used_as_metadata = Grit::Assays::ExperimentMetadatum.unscoped.where(vocabulary_id: vocabulary_id, vocabulary_item_id: id).count(:all).positive?
    raise "'#{self.name}' of '#{self.vocabulary.name}' is used as value of at least one experiment metadata" if used_as_metadata
  end

  def check_experiment_metadata
    used_as_metadata = Grit::Assays::ExperimentMetadatum.unscoped.where(vocabulary_id: vocabulary_id, vocabulary_item_id: id).count(:all).positive?
    raise "'#{self.name}' of '#{self.vocabulary.name}' is used as value of at least one experiment metadata" if used_as_metadata
  end
end
