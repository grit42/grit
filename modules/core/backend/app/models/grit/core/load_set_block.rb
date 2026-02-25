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
      load_set_block_id =  params[:load_set_block_id]
      self.unscoped.from("lsb_#{load_set_block_id}")
        .select(
          "lsb_#{load_set_block_id}.line",
          "to_jsonb(raw_lsb_#{load_set_block_id}) as datum",
          "lsb_#{load_set_block_id}.record_errors",
        )
        .joins("JOIN raw_lsb_#{load_set_block_id} ON raw_lsb_#{load_set_block_id}.line = lsb_#{load_set_block_id}.line")
        .where("lsb_#{load_set_block_id}.record_errors IS NOT NULL")
    end

    def self.warning_data(params = nil)
      raise "No load set block id provided" if params.nil? or params[:load_set_block_id].nil?
      load_set_block_id =  params[:load_set_block_id]
      self.unscoped.from("lsb_#{load_set_block_id}")
        .select(
          "lsb_#{load_set_block_id}.line",
          "to_jsonb(raw_lsb_#{load_set_block_id}) as datum",
          "lsb_#{load_set_block_id}.record_warnings",
        )
        .joins("JOIN raw_lsb_#{load_set_block_id} ON raw_lsb_#{load_set_block_id}.line = lsb_#{load_set_block_id}.line")
        .where("lsb_#{load_set_block_id}.record_warnings IS NOT NULL")
    end

    def flattened_errors
      load_set_block = self
      load_set_block_id =  self.id

      property_column_mapping_values = load_set_block.mappings.map do |key, mapping|
        if mapping["constant"]
          "('#{key}','Constant value',NULL)"
        else
          header = load_set_block.headers.find { |h| h["name"] == mapping["header"] }
          header.nil? ? nil : "('#{key}','#{header["display_name"]}','#{mapping["header"]}')"
        end
      end
      .select { |v| !v.nil? }

      property_column_mappings_sql = "SELECT PROPERTY, CSV_COLUMN_NAME, DB_COLUMN_NAME FROM ( VALUES " + property_column_mapping_values.join(",") + " ) AS T (PROPERTY, CSV_COLUMN_NAME, DB_COLUMN_NAME)"

      self.class.unscoped.from("lsb_#{load_set_block_id}")
        .select(
          "lsb_#{load_set_block_id}.line",
          "property_column_mappings.csv_column_name as column_name",
          "to_jsonb(raw_lsb_#{load_set_block_id}) ->> property_column_mappings.db_column_name as value",
          "a.value as error"
        )
        .joins("join raw_lsb_#{load_set_block_id} on lsb_#{load_set_block_id}.line = raw_lsb_#{load_set_block_id}.line")
        .joins("cross join lateral jsonb_each(lsb_#{load_set_block_id}.record_errors) as e (error_key, value)")
        .joins("cross join lateral jsonb_array_elements_text(e.value) as a (value)")
        .joins("join property_column_mappings on property_column_mappings.property = e.error_key")
        .where("lsb_#{load_set_block_id}.record_errors is not null")
        .with(property_column_mappings: Arel.sql(property_column_mappings_sql))
    end

    def errored_rows
      load_set_block_id =  self.id
      self.class.unscoped.from("raw_lsb_#{load_set_block_id}")
        .select(
          "raw_lsb_#{load_set_block_id}.*",
        )
        .joins("JOIN lsb_#{load_set_block_id} ON raw_lsb_#{load_set_block_id}.line = lsb_#{load_set_block_id}.line")
        .where("lsb_#{load_set_block_id}.record_errors IS NOT NULL")
    end

    def preview_data
      raw_data_klass
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
        t.bigint :line, primary_key: true
        columns.each do |column|
          t.string column
        end
      end
    end

    def seed_raw_data_table
      columns_string = headers.size > 0 ? "(\"line\",\"#{headers.map { |h| h["name"] }.join('","')}\")" : ""
      options_string = "WITH (" + [ "DELIMITER ','", "QUOTE '\"'", "FORMAT CSV" ].compact.join(", ") + ")"

      db_connection = ActiveRecord::Base.connection_pool.checkout
      begin
        raw_connection = db_connection.raw_connection
        raw_connection.copy_data %(COPY "#{raw_data_table_name}" #{columns_string} FROM STDIN #{options_string}) do
          Grit::Core::EntityLoader.load_set_block_records_from_file(self) do |line|
            raw_connection.put_copy_data(line) unless line.nil?
          end
        end
      ensure
        ActiveRecord::Base.connection_pool.checkin(db_connection)
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
    end

    def headers_from_file
      update_column(:headers, Grit::Core::EntityLoader.load_set_block_columns_from_file(self))
    end

    def initialize_raw_data_table
      headers_from_file
      create_raw_data_table
      seed_raw_data_table
    end

    def create_loading_records_table
      drop_loading_records_table
      columns = Grit::Core::EntityLoader.load_set_block_loading_fields(self)
      ActiveRecord::Base.connection.create_table loading_records_table_name, id: false, if_not_exists: true do |t|
        t.bigint :line, primary_key: true
        columns.reject { |column| [ "id", "created_at", "created_by", "updated_at", "updated_by" ].include? column[:name] } .each do |column|
          if column[:type].to_s == "entity" or column[:type].to_s == "integer"
            t.column column[:name], :bigint
          elsif column[:type].to_s == "decimal"
            t.column column[:name], :decimal
          else
            t.column column[:name], column[:type]
          end
        end
        t.jsonb :record_errors
        t.jsonb :record_warnings
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

    def raw_data_klass
      load_set_block = self
      klass = Class.new(ActiveRecord::Base) do
        self.table_name = load_set_block.raw_data_table_name
      end
      klass
    end

    def loading_record_klass
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
