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

Grit::Core::Vocabulary.class_eval do
  has_many :experiment_metadata_template_metadata, dependent: :destroy, class_name: "Grit::Assays::ExperimentMetadataTemplateMetadatum"

  before_destroy :check_data_sheet_column
  before_destroy :check_assay_metadata_definitions

  def check_data_sheet_column
    if Grit::Assays::AssayDataSheetColumn.unscoped.where(data_type_id: self.data_type.id).count.positive?
      raise ActiveRecord::RecordNotDestroyed.new "Vocabulary '#{self.name}' is used as data type of a column of at least one experiment data sheet"
    end
  end

  def check_assay_metadata_definitions
    used_as_metadata = Grit::Assays::AssayMetadataDefinition.unscoped.where(vocabulary_id: id).count(:all).positive?
    raise "'#{self.name}' is used in at least one assay metadata definition" if used_as_metadata
  end
end
