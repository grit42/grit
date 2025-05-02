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

Grit::Core::LoadSet.class_eval do
  def self.by_experiment(params = nil)
    self.detailed
    .joins("INNER JOIN grit_assays_experiment_data_sheet_record_load_sets grit_assays_experiment_data_sheet_record_load_sets__ on grit_assays_experiment_data_sheet_record_load_sets__.load_set_id = grit_core_load_sets.id")
    .where(ActiveRecord::Base.sanitize_sql_array([ "grit_assays_experiment_data_sheet_record_load_sets__.experiment_id = ?", params[:experiment_id] ]))
  end
end
