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
  before_destroy :check_experiment_data_sheet_record_values

  def check_experiment_data_sheet_record_values
    used_as_value = Grit::Assays::AssayDataSheetColumn.unscoped
      .includes(:experiment_data_sheet_values)
      .where(data_type_id: self.vocabulary.data_type.id)
      .any? do |assay_data_sheet_column|
        assay_data_sheet_column.experiment_data_sheet_values.any? do |value|
          value.entity_id_value == self.id
        end
      end
    raise "'#{self.name}' of '#{self.vocabulary.name}' is used as value of at least one experiment data point" if used_as_value
  end
end
