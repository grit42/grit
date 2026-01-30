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
  class LoadSetBlock < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :status, class_name: "Grit::Core::LoadSetStatus"
    belongs_to :load_set
    has_one_attached :data

    before_destroy :check_status

    entity_crud_with create: [], read: [], update: [], destroy: []

    def self.entity_fields(params = nil)
      @entity_fields ||= self.entity_fields_from_properties(
        self.db_properties
          .select { |p| [ "name", "separator" ].include?(p[:name]) })
          .map { |p| p[:name] != "separator" ? p : {
            **p,
            type: "select",
            select: {
              options: [
                { label: "Comma ( , )", value: "," },
                { label: "Tab ( \\t )", value: "\t" },
                { label: "Semicolon ( ; )", value: ";" },
                { label: "Colon ( : )", value: ":" },
                { label: "Pipe ( | )", value: "|" }
              ]
            }
          }}
    end

    # def self.detailed(params = nil)
    #   self.unscoped
    #   .select("grit_core_load_sets.id")
    #   .select("grit_core_load_sets.created_at")
    #   .select("grit_core_load_sets.created_by")
    #   .select("grit_core_load_sets.updated_at")
    #   .select("grit_core_load_sets.updated_by")
    #   .select("grit_core_load_sets.name")
    #   .select("grit_core_load_sets.entity")
    #   .select("grit_core_load_sets.separator")
    #   .select("grit_core_load_sets.origin_id")
    #   .select("grit_core_load_sets.status_id")
    #   .select("grit_core_load_sets.item_count")
    #   .select("grit_core_load_sets.mappings")
    #   .select("grit_core_load_sets.record_errors")
    #   .select("grit_core_load_sets.record_warnings")
    #   .select("grit_core_load_set_statuses__.name as status_id__name")
    #   .select("grit_core_origins__.name as origin_id__name")
    #   .joins("LEFT OUTER JOIN grit_core_load_set_statuses grit_core_load_set_statuses__ ON grit_core_load_set_statuses__.id = grit_core_load_sets.status_id")
    #   .joins("LEFT OUTER JOIN grit_core_origins grit_core_origins__ ON grit_core_origins__.id = grit_core_load_sets.origin_id")
    # end

    def self.by_entity(params)
      self.detailed.where([ "grit_core_load_sets.entity = ?", params[:entity] ])
    end

    def self.by_vocabulary(params = nil)
      self.detailed
      .joins("INNER JOIN grit_core_vocabulary_item_load_sets grit_core_vocabulary_item_load_sets__ on grit_core_vocabulary_item_load_sets__.load_set_id = grit_core_load_sets.id")
      .where(ActiveRecord::Base.sanitize_sql_array([ "grit_core_vocabulary_item_load_sets__.vocabulary_id = ?", params[:vocabulary_id] ]))
    end

    # def self.with_data
    #   self.details
    #   .select("
    #     grit_core_load_sets.data
    #   ")
    # end

    MAX_FILE_SIZE = 50.megabytes

    def self.read_file(file)
      if file.size > MAX_FILE_SIZE
        raise MaxFileSizeExceededError.new "File size exceeds maximum allowed size of 50MB"
        return
      end

      content = "".force_encoding("UTF-8")
      until file.eof?
        content << file.read(1.megabyte)
      end
      content
    end

    def drop_table
      connection = ActiveRecord::Base.connection
      table = "raw_lsb_#{id}"
      connection.drop_table table, if_exists: true
    end

    def create_table
      data.open do |file|

        io = file.instance_of?(String) ? File.open(file, get_file_mode('r', options[:encoding])) : file
        line = io.gets
        headers_list = CSV.parse(line,
                          col_sep: separator,
                          liberal_parsing: true,
                          encoding: "utf-8"
                        )[0]

        columns_list = []
        headers_list.each_index do |index|
          columns_list.push "col_#{index}"
        end

        columns_string = columns_list.size > 0 ? "(\"row\",\"#{columns_list.join('","')}\")" : ""
        quote = '"'
        options_string = "WITH (" + ["DELIMITER '#{separator}'", "QUOTE '#{quote}'", "FORMAT CSV"].compact.join(', ') + ")"

        connection = ActiveRecord::Base.connection

        table = "raw_lsb_#{id}"
        connection.drop_table table, if_exists: true
        connection.create_table table, id: false do |t|
          t.integer :row
          columns_list.each do |column|
            t.string column
          end
        end

        connection.raw_connection.copy_data %{COPY "#{table}" #{columns_string} FROM STDIN #{options_string}} do
          file.each_line(chomp: true).with_index do |line, lineno|
            cd = "#{lineno+1},#{line}"

            row = CSV.parse_line(cd.strip, col_sep: separator)
            cd = CSV.generate_line(row, col_sep: separator)
            connection.raw_connection.put_copy_data(cd)
          end
        end
      end
    end

    private
      def check_status
        throw :abort if self.status.name == "Succeeded"
      end
  end
end
