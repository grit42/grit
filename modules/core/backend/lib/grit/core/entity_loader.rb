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

    def self.load_set_loaded_data_columns(load_set)
      loader(load_set.entity).loaded_data_columns(load_set)
    end

    def self.confirm_load_set(load_set)
      loader(load_set.entity).confirm(load_set)
    end

    def self.validate_load_set(load_set)
      loader(load_set.entity).validate(load_set)
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
      load_set.as_json
    end

    def self.create(params)
      data = read_data(params[:data].tempfile)

      parsed_data = self.parse(data, params[:separator])

      record = Grit::Core::LoadSet.new({
        name: params[:name],
        entity: params[:entity],
        data: data,
        separator: params[:separator],
        parsed_data: parsed_data,
        origin_id: params[:origin_id],
        status_id: Grit::Core::LoadSetStatus.find_by(name: "Mapping").id
      })

      record.save!
      record
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
            elsif !find_by.blank?
              begin
                field_entity = entity_property[:entity][:full_name].constantize
                value = field_entity.loader_find_by!(find_by, datum[header_index]).id
              rescue NameError
                record_errors[entity_property[:name].to_s] = [ "#{entity_property[:entity][:full_name]}: No such model" ]
                value = 0
              rescue ActiveRecord::RecordNotFound
                record_errors[entity_property[:name].to_s] = [ "could not find #{entity_property[:entity][:full_name]} with '#{find_by}' = #{datum[header_index]}" ]
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

    def self.parse(data, separator)
      raise ParseException, "Separator must be provided" if separator.blank?
      begin
        parsed = CSV.parse(data,
                          col_sep: separator,
                          liberal_parsing: true,
                          encoding: "bom|utf-8"
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
