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
  class DataTableRowsController < ApplicationController
    include Grit::Core::GritEntityController

    def export
      params[:scope] = "detailed"
      query = index_entity_for_export(params)
      return if query.nil?

      if params[:columns]&.length
        data_table = DataTable.find(params[:data_table_id])
        query = data_table.entity_data_type.model.unscoped.select(*params[:columns]).from(query, :sub)
      end

      file = csv_from_query(query)

      send_data file.read, filename: export_file_name, type: "text/csv"
    rescue StandardError => e
      logger.info e.message
      logger.info e.backtrace.join("\n")
    end
  end
end
