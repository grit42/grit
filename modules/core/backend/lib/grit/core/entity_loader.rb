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

require "active_support/core_ext/numeric/bytes"
require "csv"

module Grit::Core
  class EntityLoader
    class ParseException < RuntimeError
    end

    class MaxFileSizeExceededError < RuntimeError
    end

    def self.loader(load_set_entity)
      begin
        loader = "#{load_set_entity}Loader".constantize
      rescue NameError
        loader = self
      end
      loader
    end

    def self.load_set_fields(params)
      loader(params[:entity]).fields(params)
    end

    def self.create_load_set(params)
      loader(params[:entity]).create(params)
    end

    def self.load_set_data_fields(load_set)
      loader(load_set.entity).data_set_fields(load_set)
    end

    def self.show_load_set(load_set)
      loader(load_set.entity).show(load_set)
    end

    def self.destroy_load_set(load_set)
      loader(load_set.entity).destroy(load_set)
    end

    def self.load_set_mapping_fields(load_set)
      loader(load_set.entity).mapping_fields(load_set)
    end

    def self.load_set_entity_info(load_set)
      loader(load_set.entity).entity_info(load_set)
    end

    def self.load_set_loaded_data_columns(load_set)
      loader(load_set.entity).loaded_data_columns(load_set)
    end

    def self.confirm_load_set(load_set)
      loader(load_set.entity).confirm(load_set)
    end

    def self.confirm_load_set_block(load_set_block)
      loader(load_set_block.load_set.entity).confirm_block(load_set_block)
    end

    def self.validate_load_set(load_set)
      loader(load_set.entity).validate(load_set)
    end

    def self.validate_load_set_block(load_set_block)
      loader(load_set_block.load_set.entity).validate_block(load_set_block)
    end

    def self.rollback_load_set(load_set)
      loader(load_set.entity).rollback(load_set)
    end

    def self.rollback_load_set_block(load_set_block)
      loader(load_set_block.load_set.entity).rollback_block(load_set_block)
    end

    def self.set_load_set_data(load_set, data, **args)
      loader(load_set.entity).set_data(load_set, data, **args)
    end

    protected
    def self.fields(params)
      fields = Grit::Core::LoadSet.entity_fields.filter { |f| f[:name] != "data" }.to_h { |item| [ item[:name], item.dup ] }
      fields["entity"][:disabled] = true unless fields["entity"].nil?
      fields["separator"][:required] = true unless fields["separator"].nil?
      fields["separator"][:placeholder] = "Will attempt to guess based on provided data" unless fields["separator"].nil?
      fields.values
    end

    def self.data_set_fields(params)
      self.fields(params).filter { |f| f[:name] == "separator" }
    end

    def self.show(load_set)
      load_set_blocks = Grit::Core::LoadSetBlock.detailed.where(load_set_id: load_set.id)
      { **load_set.as_json, load_set_blocks: load_set_blocks.as_json }
    end

    def self.create(params)
      load_set = Grit::Core::LoadSet.new({
        name: params[:name],
        entity: params[:entity],
        origin_id: params[:origin_id],
      })

      load_set.save!

      block = Grit::Core::LoadSetBlock.new({
        load_set_id: load_set.id,
        name: params[:load_set_blocks]["0"]["name"],
        separator: params[:load_set_blocks]["0"]["separator"],
        data: params[:load_set_blocks]["0"]["data"],
        status_id: Grit::Core::LoadSetStatus.find_by(name: "Created").id
      })
      block.save!
      load_set
    end

    def self.destroy(load_set)
      load_set.destroy!
    end

    def self.loaded_data_columns(load_set)
      load_set.entity.constantize.entity_columns(**self.show(load_set).symbolize_keys!)
    end

    def self.validate(load_set)
      load_set_entity = load_set.entity.constantize
      load_set_entity_properties = load_set_entity.entity_properties
      data = load_set.parsed_data[1..]
      errors = []

      Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
      Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)

      data.each_with_index do |datum, index|
        record_props = {}
        record_errors = {}
        ActiveRecord::Base.transaction(requires_new: true) do
          loading_record = LoadSetLoadingRecord.new({
            load_set_id: load_set.id,
            number: index
          })
          loading_record.save!
          load_set_entity_properties.each do |entity_property|
            mapping = load_set.mappings[entity_property[:name].to_s]
            next if mapping.nil?
            find_by = mapping["find_by"]
            header_index = mapping["header"].to_i unless mapping["header"].nil? or mapping["header"].blank?
            value = nil
            if mapping["constant"]
              value = mapping["value"]
            elsif !find_by.blank? and !datum[header_index].blank?
              begin
                field_entity = entity_property[:entity][:full_name].constantize
                value = field_entity.loader_find_by!(find_by, datum[header_index]).id
              rescue NameError
                record_errors[entity_property[:name].to_s] = [ "#{entity_property[:entity][:name]}: No such model" ]
                value = 0
              rescue ActiveRecord::RecordNotFound
                record_errors[entity_property[:name].to_s] = [ "could not find #{entity_property[:entity][:name]} with '#{find_by}' = #{datum[header_index]}" ]
                value = 0
              end
            elsif !header_index.nil?
              value = datum[header_index]
            end
            loading_record_property_value_props = {
              load_set_id: load_set.id,
              load_set_loading_record_id: loading_record.id,
              name: entity_property[:name]
            }
            if entity_property[:type] == "entity"
              loading_record_property_value_props["entity_id_value"] = value
            else
              loading_record_property_value_props["#{entity_property[:type]}_value"] = value
            end

            loading_record_property_value = LoadSetLoadingRecordPropertyValue.new(loading_record_property_value_props)
            loading_record_property_value.save!

            record_props[entity_property[:name].to_s] = value
            if entity_property[:required] && value.nil?
              record_errors[entity_property[:name].to_s] = [ "can't be blank" ]
            elsif (entity_property[:type].to_s == "integer" or entity_property[:type].to_s == "float" or entity_property[:type].to_s == "decimal") and !value.nil? and !value.blank? and !/^[+\-]?(\d+\.\d*|\d*\.\d+|\d+)([eE][+\-]?\d+)?$/.match?(value.to_s)
              record_errors[entity_property[:name].to_s] = [ "is not a number" ]
            elsif entity_property[:type].to_s == "datetime" and !value.nil? and !value.blank?
              begin
                record_props[entity_property[:name].to_s] = DateTime.parse(value)
              rescue
                record_errors[entity_property[:name].to_s] = [ "Unable to parse datetime, please use YYYY/MM/DD HH:mm:ss or ISO 8601" ]
              end
            elsif entity_property[:type].to_s == "date" and !value.nil? and !value.blank?
              begin
                record_props[entity_property[:name].to_s] = Date.parse(value)
              rescue
                record_errors[entity_property[:name].to_s] = [ "Unable to parse date, please use YYYY/MM/DD or ISO 8601" ]
              end
            end
          end

          if !record_errors.empty?
            errors.push({ index: index, datum: datum, errors: record_errors })
            raise ActiveRecord::Rollback
          end

          record = load_set_entity.new(record_props)
          unless record.valid?
            errors.push({ index: index, datum: datum, errors: record.errors })
            raise ActiveRecord::Rollback
          end
        end
      end
      { errors: errors }
    end

    def self.load_set_block_record_klass(load_set_block)
        fields = load_set_block.load_set.entity.constantize.entity_fields
        klass = Class.new(ActiveRecord::Base) do
        self.table_name = "lsb_#{load_set_block.id}"
        @load_set_block = load_set_block
        @fields = fields

        def self.detailed(params = nil)
          query = self.unscoped
            .select("#{self.table_name}.id")
            .select("#{self.table_name}.errors")
            .select("#{self.table_name}.warnings")

          @fields.each do |column|
            query = query.select("#{self.table_name}.#{column[:name]}")
            # if column.data_type.is_entity
            #   entity_klass = column.data_type.model
            #   query = query
            #     .joins("LEFT OUTER JOIN #{column.data_type.table_name} #{column.safe_name}__entities on #{column.safe_name}__entities.id = #{@sheet.table_name}.#{column.safe_name}")
            #   for display_property in entity_klass.display_properties do
            #     query = query
            #       .select("#{column.safe_name}__entities.#{display_property[:name]} as #{column.safe_name}__#{display_property[:name]}") unless entity_klass.display_properties.nil?
            #   end
            # end
          end
          query
        end

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

    def self.create_temporary_table(load_set_block)
      columns = load_set_block.load_set.entity.constantize.entity_fields
      connection = ActiveRecord::Base.connection
      connection.drop_table "lsb_#{load_set_block.id}", if_exists: true
      connection.create_table "lsb_#{load_set_block.id}", id: false, if_not_exists: true do |t|
        t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
        columns.each do |column|
          if column[:type].to_s == "entity"
            t.column column[:name], :bigint
          elsif column[:type].to_s == "integer"
            t.column column[:name], :numeric, precision: 1000, scale: 0
          elsif column[:type].to_s == "decimal"
            t.column column[:name], :numeric
          else
            t.column column[:name], column[:type]
          end
        end
        t.column :number, :bigint
        t.column :datum, :jsonb
        t.column :record_errors, :jsonb
        t.column :record_warnings, :jsonb
      end
    end

    def self.drop_temporary_table(load_set_block)
      ActiveRecord::Base.connection.drop_table "lsb_#{load_set_block.id}", if_exists: true
    end


    def self.validate_block(load_set_block)
      load_set_entity_properties = load_set_block.load_set.entity.constantize.entity_fields

      Grit::Core::LoadSetBlockLoadingRecord.delete_by(load_set_block_id: load_set_block.id)

      create_temporary_table(load_set_block)
      load_set_record_klass = load_set_block_record_klass(load_set_block)

      errors = []
      records = []

      load_set_block.preview_data.each do |datum|
        record = {
          number: datum[:row],
          errors: nil,
        }

        load_set_entity_properties.each do |entity_property|
          entity_property_name = entity_property[:name].to_s
          mapping = load_set_block.mappings[entity_property_name]
          next if mapping.nil?
          find_by = mapping["find_by"]
          header = mapping["header"] unless mapping["header"].nil? or mapping["header"].blank?
          value = nil
          if mapping["constant"]
            value = mapping["value"]
          elsif !find_by.blank? and !datum[header].blank?
            begin
              field_entity = entity_property[:entity][:full_name].constantize
              value = field_entity.loader_find_by!(find_by, datum[header], options: entity_property[:entity][:options]).id
            rescue NameError
              record[:errors] ||= {}
              record[:errors][entity_property_name] = [ "#{entity_property[:entity][:name]}: No such model" ]
              value = 0
            rescue ActiveRecord::RecordNotFound
              record[:errors] ||= {}
              record[:errors][entity_property_name] = [ "could not find #{entity_property[:entity][:name]} with '#{find_by}' = #{datum[header]}" ]
              value = 0
            end
          elsif !header.nil?
            value = datum[header]
          end

          record[entity_property_name] = value

          if entity_property[:required] && value.nil?
            record[:errors] ||= {}
            record[:errors][entity_property_name] = [ "can't be blank" ]
          elsif entity_property[:type].to_s == "decimal" and !value.nil? and !value.blank? and !/^[+\-]?(\d+\.\d*|\d*\.\d+|\d+)([eE][+\-]?\d+)?$/.match?(value.to_s)
            record[:errors] ||= {}
            record[:errors][entity_property_name] = [ "is not a number" ]
          elsif entity_property[:type].to_s == "integer" and !value.nil? and !value.blank? and !/^[+\-]?\d+([eE][+]?\d+)?$/.match?(value.to_s)
            record[:errors] ||= {}
            record[:errors][entity_property_name] = [ "is not a integer" ]
          elsif entity_property[:type].to_s == "datetime" and !value.nil? and !value.blank?
            begin
              record[entity_property_name] = DateTime.parse(value)
            rescue
              record[:errors] ||= {}
              record[:errors][entity_property_name] = [ "Unable to parse datetime, please use YYYY/MM/DD HH:mm:ss or ISO 8601" ]
            end
          elsif entity_property[:type].to_s == "date" and !value.nil? and !value.blank?
            begin
              record[entity_property_name] = Date.parse(value)
            rescue
              record[:errors] ||= {}
              record[:errors][entity_property_name] = [ "Unable to parse date, please use YYYY/MM/DD or ISO 8601" ]
            end
          end
        end

        unless record[:errors].nil?
          errors.push({ index: datum[:row], datum: datum, errors: record[:errors] })
          records.push ({
            number: datum[:row],
            datum: datum,
            record_errors: record[:errors],
          })
        else
          records.push record
        end
      end
      load_set_record_klass.insert_all(records)
      { errors: errors }
    end

    def self.confirm(load_set)
      load_set_entity = load_set.entity.constantize
      load_set_entity_properties = load_set_entity.entity_properties
      load_set_entity_table = load_set_entity.table_name

      ActiveRecord::Base.transaction do
        Grit::Core::LoadSetLoadingRecord.includes(:load_set_loading_record_property_values).where(load_set_id: load_set.id).each do |loading_record|
          record_props = {}
          loading_record.load_set_loading_record_property_values.each do |loading_record_property_value|
            entity_property = load_set_entity_properties.find { |p| p[:name] == loading_record_property_value.name }
            if entity_property[:type] == "entity"
              record_props[loading_record_property_value.name] = loading_record_property_value.entity_id_value
            else
              record_props[loading_record_property_value.name] = loading_record_property_value["#{entity_property[:type]}_value"]
            end
          end

          record = load_set_entity.new(record_props)
          record.save!

          Grit::Core::LoadSetLoadedRecord.new({
            load_set_id: load_set.id,
            table: load_set_entity_table,
            record_id: record.id
          }).save!
        end

        Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
        Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)
      end
    end

    def self.confirm_block(load_set_block)
      entity_klass = load_set_block.load_set.entity.constantize
      fields = load_set_block.load_set.entity.constantize.entity_fields

      insert = "WITH inserted_records as (INSERT INTO #{entity_klass.table_name}(created_by"
      fields.each do |column|
        insert += ",#{column[:name]}"
      end
      insert += ") "

      load_set_record_klass = load_set_block_record_klass(load_set_block)
      insert += load_set_record_klass.for_confirm.where(errors: nil).to_sql
      insert += " RETURNING id) INSERT INTO grit_core_load_set_block_loaded_records(\"record_id\",\"load_set_block_id\",\"table\") SELECT inserted_records.id,#{load_set_block.id}, '#{entity_klass.table_name}' from inserted_records"

      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute(insert)
        drop_temporary_table(load_set_block)
      end
    end

    def self.rollback(load_set)
      load_set_entity = load_set.entity.constantize

      load_set_entity.destroy_by("id IN (SELECT record_id FROM grit_core_load_set_loaded_records WHERE grit_core_load_set_loaded_records.load_set_id = #{load_set.id})")
      Grit::Core::LoadSetLoadedRecord.destroy_by(load_set_id: load_set.id)
      Grit::Core::LoadSetLoadingRecord.destroy_by(load_set_id: load_set.id)
    end

    def self.rollback_block(load_set_block)
      load_set_entity = load_set_block.load_set.entity.constantize

      load_set_entity.delete_by("id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = #{load_set_block.id})")
      Grit::Core::LoadSetBlockLoadedRecord.delete_by(load_set_block_id: load_set_block.id)
    end

    def self.mapping_fields(load_set)
      load_set.entity.constantize.entity_fields
    end

    def self.set_data(load_set, tempfile, **args)
      data = read_data(tempfile)
      parsed_data = self.parse(data, args[:separator])
      load_set.data = data
      load_set.separator = args[:separator]
      load_set.parsed_data = parsed_data
      load_set.status_id = Grit::Core::LoadSetStatus.find_by(name: "Mapping").id
      load_set.record_errors = nil
      load_set.record_warnings = nil
      ActiveRecord::Base.transaction do
        Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
        Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)
        load_set.save!
      end
      load_set
    end

    def self.entity_info(load_set)
      model = load_set.entity.constantize
      {
        full_name: model.name,
        name: model.name.demodulize.underscore.humanize,
        plural: model.name.demodulize.underscore.humanize.pluralize,
        path: model.name.underscore.pluralize,
        dictionary: true
      }
    end

    def self.parse(data, separator)
      raise ParseException, "Separator must be provided" if separator.blank? && separator != "\t"
      begin
        parsed = CSV.parse(data,
                          col_sep: separator,
                          liberal_parsing: true,
                          encoding: "utf-8"
                        )

        cleaned = parsed.reject { |row| row.all?(&:blank?) }
        return cleaned if cleaned.map(&:size).uniq.size == 1
      rescue CSV::MalformedCSVError => e
        raise ParseException.new "Malformed CSV data: #{e.message}"
      rescue ArgumentError => e
        raise ParseException.new "Invalid CSV parameters: #{e.message}"
      rescue Encoding::InvalidByteSequenceError => e
        raise ParseException.new "Invalid character encoding in CSV: #{e.message}"
      rescue StandardError => e
        raise ParseException.new "Failed to parse CSV: #{e.message}"
      end
      raise ParseException.new "Inconsistent column count in CSV rows"
    end


    MAX_FILE_SIZE = 50.megabytes

    def self.read_data(file)
      if file.size > MAX_FILE_SIZE
        raise MaxFileSizeExceededError.new "File size exceeds maximum allowed size of 50MB"
        return
      end

      data = "".force_encoding("UTF-8")
      until file.eof?
        data << file.read(1.megabyte)
      end
      data
    end
  end
end
