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

Grit::Core::VocabularyItem.class_eval do
  before_destroy :check_compound_property_values
  before_destroy :check_batch_property_values
  before_destroy :check_assay_metadata

  def check_compound_property_values
    used_as_value = Grit::Compounds::CompoundProperty.unscoped
      .includes(:compound_property_values)
      .where(data_type_id: self.vocabulary.data_type.id)
      .any? do |compound_property|
        compound_property.compound_property_values.any? do |property_value|
          property_value.entity_id_value == self.id
        end
      end
    raise "'#{self.name}' of '#{self.vocabulary.name}' is used as value of at least one compound property" if used_as_value
  end

  def check_batch_property_values
    used_as_value = Grit::Compounds::BatchProperty.unscoped
      .includes(:batch_property_values)
      .where(data_type_id: self.vocabulary.data_type.id)
      .any? do |batch_property|
        batch_property.batch_property_values.any? do |property_value|
          property_value.entity_id_value == self.id
        end
      end
    raise "'#{self.name}' of '#{self.vocabulary.name}' is used as value of at least one batch property" if used_as_value
  end

  def check_assay_metadata
    if Grit::Assays::AssayMetadatum.unscoped.where(vocabulary_item_id: self.id).length.positive?
      raise "'#{self.name}' of '#{self.vocabulary.name}' is used as value of at least one assay metadatum"
    end
  end
end
