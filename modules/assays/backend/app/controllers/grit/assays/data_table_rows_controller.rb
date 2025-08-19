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
