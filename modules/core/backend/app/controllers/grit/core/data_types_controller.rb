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
      columns = params[:columns]

      common_table_expressions = []
      data_type_names_queries = []
      Grit::Core::DataType.where(is_entity: true).order(:id)
      .each do |data_type|
        data_type.model.display_properties.each do |display_property|
          data_type_names_queries.push("SELECT #{display_property[:name]} as value_name, #{data_type.id} as data_type_id, '#{data_type.name}' as data_type_name FROM grit_core_vocabulary_items WHERE vocabulary_id = #{data_type[:meta]["vocabulary_id"]}") unless data_type[:meta]["vocabulary_id"].nil?
          data_type_names_queries.push("SELECT #{display_property[:name]} as value_name, #{data_type.id} as data_type_id, '#{data_type.name}' as data_type_name FROM #{data_type.table_name}") if data_type[:meta]["vocabulary_id"].nil?
        end
      end

      common_table_expressions.push("data_type_values AS (#{data_type_names_queries.join("\n UNION ALL \n")})") if data_type_names_queries.length.positive?
      common_table_expressions.push("data_type_values AS (SELECT null as data_type_name, null as data_type_id, null as value_name)") unless data_type_names_queries.length.positive?

      column_query_values = []
      columns.each do |key, values|
        values.each do |value|
          column_query_values.push(ActiveRecord::Base.sanitize_sql_array([ "(?,?)", key.to_s, value.to_s.strip ]))
        end
      end

      common_table_expressions.push("column_values AS (SELECT column_id, column_value FROM (values #{column_query_values.join(', ')}) column_values(column_id,column_value))") if column_query_values.length.positive?
      common_table_expressions.push("column_values AS (SELECT null as column_id, null as column_value)") unless column_query_values.length.positive?

      query = <<-SQL
        #{"WITH #{common_table_expressions.join(', ')}" if common_table_expressions.length.positive?}
        SELECT
          column_values.column_id,
          data_type_values.data_type_name,
          data_type_values.data_type_id,
          count(data_type_values.data_type_id)
        FROM column_values
        LEFT OUTER JOIN data_type_values ON data_type_values.value_name = column_values.column_value
        GROUP BY
          column_values.column_id,
          data_type_values.data_type_name,
          data_type_values.data_type_id
        HAVING
          count(data_type_values.data_type_id) > 0
      SQL

      res = ActiveRecord::Base.connection.execute(query)

      render json: { success: true, data: res }
    end
  end
end
