#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-core.
#
# grit-core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-core. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit::Core
  class DataTypesController < ApplicationController
    include GritEntityController

    def guess_data_type_for_columns
      start = Time.now
      columns = params[:columns]

      loaded_time = Time.now
      logger.info "Loaded payload in #{loaded_time - start}"

      data_type_names_queries = []
      Grit::Core::DataType.where(is_entity: true).where("meta->'vocabulary_id' IS NOT NULL").order(:id)
      .first(1002)
      .each do |data_type|
        # data_type_model_unscoped = data_type.model_scope.unscope(:select, :joins, :left_outer_joins)
        data_type.model.display_properties.each do |display_property|
          data_type_names_queries.push("SELECT #{display_property[:name]} as value_name, #{data_type.id} as data_type_id, '#{data_type.name}' as data_type_name FROM grit_core_vocabulary_items WHERE vocabulary_id = #{data_type[:meta]["vocabulary_id"]}")
          # data_type_names_queries.push(
          #   data_type_model_unscoped.select(
          #       "lower(#{display_property[:name]}) as value_name",
          #       "#{data_type.id} as data_type_id",
          #       "'#{data_type.name}' as data_type_name"
          #     ).to_sql
          # )
        end
      end

      data_type_names_query = data_type_names_queries.join("\n UNION ALL \n")

      dtnq_time = Time.now
      logger.info "Loaded data_type_names_queries in #{dtnq_time - loaded_time}"



      column_query_values = []
      columns.each do |key, values|
        values.each do |value|
          column_query_values.push("('#{key}','#{value.downcase}')")
        end
      end

      column_query = "SELECT column_name, column_value FROM (values #{column_query_values.join(', ')}) column_values(column_name,column_value)"

      cq_time = Time.now
      logger.info "Loaded column_query in #{cq_time - dtnq_time}"

      query = <<-SQL
        WITH column_values AS (#{column_query}), data_type_values AS (#{data_type_names_query})
        SELECT
          column_values.column_name,
          data_type_values.data_type_name,
          data_type_values.data_type_id,
          count(data_type_values.data_type_id)
        FROM column_values
        LEFT OUTER JOIN data_type_values ON data_type_values.value_name = column_values.column_value
        GROUP BY
          column_values.column_name,
          data_type_values.data_type_name,
          data_type_values.data_type_id
        HAVING
          count(data_type_values.data_type_id) > 0
      SQL

      res = ActiveRecord::Base.connection.execute(query)
      # res = DataType.unscoped
      #   .with(column_values: Arel.sql(column_query))
      #   .with(data_type_values: Arel.sql(data_type_names_query))
      #   .from("column_values")
      #   .select(
      #     "column_values.column_name",
      #     "data_type_values.data_type_name",
      #     "data_type_values.data_type_id",
      #     "count(data_type_values.data_type_id)",
      #   )
      #   .joins("LEFT OUTER JOIN data_type_values ON data_type_values.value_name = column_values.column_value")
      #   .group(
      #     "column_values.column_name",
      #     "data_type_values.data_type_name",
      #     "data_type_values.data_type_id",
      #   )
      #   .having("count(data_type_values.data_type_id) > 0")
      #   .all

      exec_query_time = Time.now
      logger.info "executed query in #{exec_query_time - cq_time}"

      render json: { success: true, data: res }

      rendered_time = Time.now
      logger.info "rendered in #{rendered_time - exec_query_time}"
    end
  end
end
