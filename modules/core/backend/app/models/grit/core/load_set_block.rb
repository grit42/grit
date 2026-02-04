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
    before_destroy :drop_tables
    after_save :drop_tables_if_succeeded

    class_eval do
      _validators.delete("separator")

      _validate_callbacks.each do |callback|
        if callback.filter.respond_to? :attributes
          callback.filter.attributes.delete "separator"
        end
      end
    end

    validate :separator_set

    def separator_set
      return if separator == "\t"
      errors.add(:separator, "cannot be blank") if separator.nil? || separator.blank?
    end

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
          "lsb_#{params[:load_set_block_id]}.line",
          "lsb_#{params[:load_set_block_id]}.datum",
          "lsb_#{params[:load_set_block_id]}.record_errors"
        )
        .where("lsb_#{params[:load_set_block_id]}.record_errors IS NOT NULL")
    end

    def preview_data
      LoadSetBlock.preview_data({ load_set_block_id: id })
    end

    def self.by_entity(params)
      self.detailed.where([ "grit_core_load_sets.entity = ?", params[:entity] ])
    end

    def self.by_vocabulary(params = nil)
      self.detailed
      .joins("INNER JOIN grit_core_vocabulary_item_load_sets grit_core_vocabulary_item_load_sets__ on grit_core_vocabulary_item_load_sets__.load_set_id = grit_core_load_sets.id")
      .where(ActiveRecord::Base.sanitize_sql_array([ "grit_core_vocabulary_item_load_sets__.vocabulary_id = ?", params[:vocabulary_id] ]))
    end

    def loading_records_table_name
      "lsb_#{id}"
    end

    def raw_data_table_name
      "raw_lsb_#{id}"
    end

    def drop_tables
      connection = ActiveRecord::Base.connection
      connection.drop_table loading_records_table_name, if_exists: true
      connection.drop_table raw_data_table_name, if_exists: true
    end

    def self.records_from_file(load_set_block)
      load_set_block.data.open do |file|
        file.each_line(chomp: true).with_index do |line, index|
          next if index == 0
          line_with_line_number = "#{index+1},#{line}"
          row = CSV.parse_line(line_with_line_number.strip, col_sep: load_set_block.separator)
          yield CSV.generate_line(row, col_sep: load_set_block.separator) if block_given?
        end
      end
    end

    def drop_raw_data_table
      ActiveRecord::Base.connection.drop_table raw_data_table_name, if_exists: true
    end

    def drop_loading_records_table
      ActiveRecord::Base.connection.drop_table loading_records_table_name, if_exists: true
    end

    def truncate_loading_records_table
      ActiveRecord::Base.connection.truncate loading_records_table_name
    end

    def drop_tables
      drop_raw_data_table
      drop_loading_records_table
    end

    def create_raw_data_table
      drop_raw_data_table
      columns = headers.map { |h| h["name"] }
      ActiveRecord::Base.connection.create_table raw_data_table_name, id: false do |t|
        t.integer :line
        columns.each do |column|
          t.string column
        end
      end
    end

    def seed_raw_data_table
      columns_string = headers.size > 0 ? "(\"line\",\"#{headers.map { |h| h["name"] }.join('","')}\")" : ""
      options_string = "WITH (" + [ "DELIMITER ','", "QUOTE '\"'", "FORMAT CSV" ].compact.join(", ") + ")"

      db_connection =  ActiveRecord::Base.connection_pool.checkout
      raw_connection = db_connection.raw_connection
      raw_connection.copy_data %(COPY "#{raw_data_table_name}" #{columns_string} FROM STDIN #{options_string}) do
        Grit::Core::EntityLoader.load_set_block_records_from_file(self) do |line|
          raw_connection.put_copy_data(line) unless line.nil?
        end
      end
    rescue PG::BadCopyFileFormat => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      self.error = "Malformed CSV file"
      self.status_id = Grit::Core::LoadSetStatus.find_by(name: "Errored").id
      self.save!
      raise "Malformed CSV file"
    rescue StandardError => e
      logger.info e.to_s
      logger.info e.backtrace.join("\n")
      self.error = e.to_s
      self.status_id = Grit::Core::LoadSetStatus.find_by(name: "Errored").id
      self.save!
      raise e.to_s
    ensure
      ActiveRecord::Base.connection_pool.checkin(db_connection)
    end

    def headers_from_file
      update_column(:headers, Grit::Core::EntityLoader.load_set_block_columns_from_file(self))
    end

    def initialize_raw_data_table
      update_column(:headers, Grit::Core::EntityLoader.load_set_block_columns_from_file(self))
      create_raw_data_table
      seed_raw_data_table
    end

    def create_loading_records_table
      drop_loading_records_table
      columns = Grit::Core::EntityLoader.load_set_block_loading_fields(self)
      ActiveRecord::Base.connection.create_table loading_records_table_name, id: false, if_not_exists: true do |t|
        columns.reject { |column| ["id","created_at","created_by","updated_at","updated_by"].include? column[:name] } .each do |column|
          if column[:type].to_s == "entity" or column[:type].to_s == "integer"
            t.column column[:name], :bigint
          elsif column[:type].to_s == "decimal"
            t.column column[:name], :numeric
          else
            t.column column[:name], column[:type]
          end
        end
        t.column :line, :bigint
        t.column :datum, :jsonb
        t.column :record_errors, :jsonb
        t.column :record_warnings, :jsonb
      end
    end

    def create_tables
      initialize_raw_data_table
      create_loading_records_table
    end

    def initialize_data
      create_tables
      update_column(:status_id, Grit::Core::LoadSetStatus.find_by(name: "Mapping").id)
    end

    def drop_tables_if_succeeded
      return if status.name != "Succeeded"
      drop_tables
    end

    def record_klass
      load_set_block = self
      fields = Grit::Core::EntityLoader.load_set_block_loading_fields(self)
      klass = Class.new(ActiveRecord::Base) do
        self.table_name = load_set_block.loading_records_table_name
        @load_set_block = load_set_block
        @fields = fields

        def self.for_confirm
          query = self.unscoped.select("'#{Grit::Core::User.current.login}' as created_by")
          @fields.each do |column|
            query = query.select("#{self.table_name}.#{column[:name]}")
          end
          query
        end
      end
      klass
    end

    private
      def check_status
        throw :abort if self.status.name == "Succeeded"
      end
  end
end
