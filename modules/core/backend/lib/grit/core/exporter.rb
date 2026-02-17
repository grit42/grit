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
  class Exporter
    def self.scope_to_csv(scope, columns, **args)
      begin
        col_sep = args[:col_sep] || ","
        temp_file = Tempfile.new
        sql = "COPY (SELECT #{columns.map { |c| c["name"] }.join(',')} from (#{scope.to_sql})) TO STDOUT WITH DELIMITER ',' CSV"

        temp_file.write(CSV.generate_line(columns.map { |c| c["display_name"] }, col_sep: col_sep))
        ActiveRecord::Base.connection.raw_connection.copy_data(sql) do
          while (row = ActiveRecord::Base.connection.raw_connection.get_copy_data)
            temp_file.write(row.force_encoding('UTF-8'))
          end
        end

        temp_file.rewind
        yield temp_file if block_given?
      ensure
        temp_file.close
        temp_file.unlink
      end
    end
  end
end
