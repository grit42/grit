#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-compounds.
#
# grit-compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-compounds. If not, see <https://www.gnu.org/licenses/>.
#++

Grit::Core::Vocabulary.class_eval do
  before_destroy :check_compound_property
  before_destroy :check_batch_property
  before_destroy :check_assay_metadata_definition

  def check_compound_property
    if Grit::Compounds::CompoundProperty.unscoped.where(data_type_id: self.data_type.id).count.positive?
      raise "Vocabulary '#{self.name}' is used as data type of at least one compound property"
    end
  end

  def check_batch_property
    if Grit::Compounds::BatchProperty.unscoped.where(data_type_id: self.data_type.id).count.positive?
      raise "Vocabulary '#{self.name}' is used as data type of at least one batch property"
    end
  end

  def check_assay_metadata_definition
    if Grit::Assays::AssayMetadataDefinition.unscoped.where(vocabulary_id: self.id).length.positive?
      raise "'#{self.name}' is used as in at least one assay metadata definition"
    end
  end
end
