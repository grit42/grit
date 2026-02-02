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
    before_destroy :drop_table
    after_commit :initialize_table
    after_save :drop_raw_data_table

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

    def self.preview_data(params = nil)
      raise "No load set block id provided" if params.nil? or params[:load_set_block_id].nil?
      self.unscoped.from("raw_lsb_#{params[:load_set_block_id]}").select("raw_lsb_#{params[:load_set_block_id]}.*")
    end

    def self.errored_data(params = nil)
      raise "No load set block id provided" if params.nil? or params[:load_set_block_id].nil?
      self.unscoped.from("lsb_#{params[:load_set_block_id]}")
        .select(
          "lsb_#{params[:load_set_block_id]}.number",
          "lsb_#{params[:load_set_block_id]}.datum",
          "lsb_#{params[:load_set_block_id]}.record_errors"
        )
        .where("lsb_#{params[:load_set_block_id]}.record_errors IS NOT NULL")
    end

    def preview_data
      LoadSetBlock.preview_data({load_set_block_id: id})
    end

    def self.by_entity(params)
      self.detailed.where([ "grit_core_load_sets.entity = ?", params[:entity] ])
    end

    def self.by_vocabulary(params = nil)
      self.detailed
      .joins("INNER JOIN grit_core_vocabulary_item_load_sets grit_core_vocabulary_item_load_sets__ on grit_core_vocabulary_item_load_sets__.load_set_id = grit_core_load_sets.id")
      .where(ActiveRecord::Base.sanitize_sql_array([ "grit_core_vocabulary_item_load_sets__.vocabulary_id = ?", params[:vocabulary_id] ]))
    end

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
      table = "lsb_#{id}"
      raw_table = "raw_lsb_#{id}"
      connection.drop_table table, if_exists: true
      connection.drop_table raw_table, if_exists: true
    end

    def create_table
      data.open do |file|
        io = file.instance_of?(String) ? File.open(file, get_file_mode('r', options[:encoding])) : file
        line = io.gets
        csv_headers_list = CSV.parse(line,
                          col_sep: separator,
                          liberal_parsing: true,
                          encoding: "utf-8"
                        )[0]

        columns_list = []
        headers_list = []
        csv_headers_list.each_with_index do |h,index|
          headers_list.push ({ name: "col_#{index}", display_name: h })
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

        update_column(:headers, headers_list)
      end
    end

    def initialize_table
      return if status.name != "Created"
      LoadSetBlock.transaction do
        update_column(:status_id, Grit::Core::LoadSetStatus.find_by(name: "Initializing").id)
        create_table
        update_column(:status_id, Grit::Core::LoadSetStatus.find_by(name: "Mapping").id)
      rescue StandardError => e
        logger.info e.to_s
        logger.info e.backtrace.join("\n")
        raise ActiveRecord::Rollback
      end
    end

    def drop_raw_data_table
      return if status.name != "Succeeded"
      drop_table
    end

    private
      def check_status
        throw :abort if self.status.name == "Succeeded"
      end
  end
end
