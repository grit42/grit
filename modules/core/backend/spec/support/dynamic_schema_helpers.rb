# frozen_string_literal: true

# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of @grit42/core.
#
# @grit42/core is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# @grit42/core is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# @grit42/core. If not, see <https://www.gnu.org/licenses/>.

# `record_klass` only works once a schema is committed, so these read and write draft rows
# by physical name: `c<id>` for a column definition, the identifier for any other column.
module DynamicSchemaHelpers
  # `values` are keyed by column identifier. Returns the new row's id.
  def insert_draft_row(table, values = {})
    connection = ActiveRecord::Base.connection
    sql = if values.empty?
      "INSERT INTO #{table.quoted_physical_table_name} DEFAULT VALUES RETURNING id"
    else
      columns = values.keys.map { |identifier| connection.quote_column_name(draft_column(table, identifier)) }
      quoted_values = values.values.map { |value| connection.quote(value) }
      "INSERT INTO #{table.quoted_physical_table_name} (#{columns.join(", ")}) VALUES (#{quoted_values.join(", ")}) RETURNING id"
    end
    connection.select_value(sql)
  end

  def draft_value(table, row_id, identifier)
    connection = ActiveRecord::Base.connection
    connection.select_value(<<~SQL.squish)
      SELECT #{connection.quote_column_name(draft_column(table, identifier))}
      FROM #{table.quoted_physical_table_name}
      WHERE id = #{connection.quote(row_id)}
    SQL
  end

  def committed_klass(table)
    schema = table.schema_definition
    schema.commit! unless schema.committed?
    table.record_klass
  end

  private

  def draft_column(table, identifier)
    identifier = identifier.to_s
    table.column_definitions.find_by(identifier: identifier)&.draft_column_name || identifier
  end
end

RSpec.configure do |config|
  config.include DynamicSchemaHelpers, type: :model
end
