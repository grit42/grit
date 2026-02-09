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

    def self.load_set_block_fields(params)
      loader(params[:entity]).block_fields(params)
    end

    def self.create_load_set(params)
      loader(params[:entity]).create(params)
    end

    def self.load_set_block_set_data_fields(load_set_block)
      loader(load_set_block.load_set.entity).block_set_data_fields(load_set_block)
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

    def self.load_set_block_mapping_fields(load_set_block)
      loader(load_set_block.load_set.entity).block_mapping_fields(load_set_block)
    end

    def self.load_set_block_loading_fields(load_set_block)
      loader(load_set_block.load_set.entity).block_loading_fields(load_set_block)
    end

    def self.load_set_entity_info(load_set)
      loader(load_set.entity).entity_info(load_set)
    end

    def self.load_set_block_entity_info(load_set_block)
      loader(load_set_block.load_set.entity).block_entity_info(load_set_block)
    end

    def self.load_set_loaded_data_columns(load_set)
      loader(load_set.entity).loaded_data_columns(load_set)
    end

    def self.load_set_block_loaded_data_columns(load_set_block)
      loader(load_set_block.load_set.entity).block_loaded_data_columns(load_set_block)
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

    def self.set_load_set_block_data(load_set_block, data, **args)
      loader(load_set_block.load_set.entity).set_block_data(load_set_block, data, **args)
    end

    def self.load_set_block_columns_from_file(load_set_block)
      loader(load_set_block.load_set.entity).columns_from_file(load_set_block)
    end

    def self.load_set_block_records_from_file(load_set_block, &block)
      loader(load_set_block.load_set.entity).records_from_file(load_set_block, &block)
    end

    protected
    def self.fields(params)
      fields = Grit::Core::LoadSet.entity_fields.to_h { |item| [ item[:name], item.dup ] }
      fields["entity"][:disabled] = true unless fields["entity"].nil?
      fields.values
    end

    def self.block_fields(params)
      fields = Grit::Core::LoadSetBlock.entity_fields.filter { |f| f[:name] != "data" }.to_h { |item| [ item[:name], item.dup ] }
      fields["separator"][:required] = true unless fields["separator"].nil?
      fields["separator"][:placeholder] = "Will attempt to guess based on provided data" unless fields["separator"].nil?
      fields.values
    end

    def self.block_set_data_fields(params)
      self.block_fields(params).filter { |f| f[:name] == "separator" }
    end

    def self.data_set_fields(params)
      self.fields(params).filter { |f| f[:name] == "separator" }
    end

    def self.create(params)
      load_set = Grit::Core::LoadSet.new({
        name: params[:name],
        entity: params[:entity],
        origin_id: params[:origin_id]
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

    def self.show(load_set)
      load_set_blocks = Grit::Core::LoadSetBlock.detailed.where(load_set_id: load_set.id)
      { **load_set.as_json, load_set_blocks: load_set_blocks.as_json }
    end

    def self.destroy(load_set)
      load_set.destroy!
    end

    def self.loaded_data_columns(load_set)
      load_set.entity.constantize.entity_columns(**self.show(load_set).symbolize_keys!)
    end

    def self.block_loaded_data_columns(load_set_block)
      load_set_block.load_set.entity.constantize.entity_columns(**load_set_block.as_json.symbolize_keys!)
    end

    def self.base_record_props(load_set_block)
      {}
    end

    def self.validate_block(load_set_block)
      load_set_block.truncate_loading_records_table

      load_set_entity = block_entity(load_set_block)
      load_set_entity_properties = block_mapping_fields(load_set_block)

      load_set_block_record_klass = load_set_block.loading_record_klass

      errors = []
      records = []
      unique_properties = Hash.new { |h, k| h[k] = Set.new }
      has_errors = false
      record = nil
      record_props = nil
      entity_property_name = nil
      mapping = nil
      find_by = nil
      header = nil
      value = nil
      duplicate_values = nil
      load_set_entity_record = nil

      new_record_props = base_record_props(load_set_block)

      load_set_block.preview_data.find_each do |datum|
        record = {
          line: datum[:line],
          record_errors: nil,
        }

        record_props = new_record_props.dup

        load_set_entity_properties.each do |entity_property|
          value = nil
          find_by = nil
          header = nil
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
              entity_property[:_klass] ||= entity_property[:entity][:full_name].constantize
              field_entity = entity_property[:_klass]
              value = field_entity.loader_find_by!(find_by, datum[header], options: entity_property[:entity][:options]).id
            rescue NameError
              record[:record_errors] ||= {}
              record[:record_errors][entity_property_name] = [ "#{entity_property[:entity][:name]}: No such model" ]
              value = 0
            rescue ActiveRecord::RecordNotFound
              record[:record_errors] ||= {}
              record[:record_errors][entity_property_name] = [ "could not find #{entity_property[:entity][:name]} with '#{find_by}' = #{datum[header]}" ]
              value = 0
            end
          elsif !header.nil?
            value = datum[header]
          end

          record_props[entity_property_name] = value

          if entity_property[:required] && value.nil?
            value = nil
            record[:record_errors] ||= {}
            record[:record_errors][entity_property_name] = [ "can't be blank" ]
          elsif entity_property[:type].to_s == "decimal" and !value.nil? and !value.blank? and !/^[+\-]?(\d+\.\d*|\d*\.\d+|\d+)([eE][+\-]?\d+)?$/.match?(value.to_s)
            value = nil
            record[:record_errors] ||= {}
            record[:record_errors][entity_property_name] = [ "is not a number" ]
          elsif entity_property[:type].to_s == "integer" and !value.nil? and !value.blank? and !/^[+\-]?\d+([eE][+]?\d+)?$/.match?(value.to_s)
            value = nil
            record[:record_errors] ||= {}
            record[:record_errors][entity_property_name] = [ "is not a integer" ]
          elsif entity_property[:type].to_s == "integer" and !value.nil? and !value.blank? and (value.to_i < -(2**53-1) || value.to_i > 2**53-1)
            value = nil
            record[:record_errors] ||= {}
            record[:record_errors][entity_property_name] = [ "is out of range" ]
          elsif entity_property[:type].to_s == "datetime" and !value.nil? and !value.blank?
            begin
              record_props[entity_property_name] = DateTime.parse(value)
            rescue
              value = nil
              record[:record_errors] ||= {}
              record[:record_errors][entity_property_name] = [ "Unable to parse datetime, please use YYYY/MM/DD HH:mm:ss or ISO 8601" ]
            end
          elsif entity_property[:type].to_s == "date" and !value.nil? and !value.blank?
            begin
              record_props[entity_property_name] = Date.parse(value)
            rescue
              value = nil
              record[:record_errors] ||= {}
              record[:record_errors][entity_property_name] = [ "Unable to parse date, please use YYYY/MM/DD or ISO 8601" ]
            end
          end

          if entity_property[:unique]
            if unique_properties[entity_property_name].include?(value)
              record[:record_errors] ||= {}
              record[:record_errors][entity_property_name] = ["should be unique (duplicate in file)"]
            else
              unique_properties[entity_property_name].add(value)
            end
          end
        end

        if record[:record_errors].nil?
          load_set_entity_record = load_set_entity.new(record_props)
          record[:record_errors] = load_set_entity_record.errors unless load_set_entity_record.valid?
        end

        unless record[:record_errors].nil?
          has_errors = true
        end

        record.merge!(record_props)
        records.push record

        if records.length >= 1000
          load_set_block_record_klass.insert_all(records)
          records = []
        end
      end
      load_set_block_record_klass.insert_all(records) if records.length.positive?
      !has_errors
    end

    def self.confirm_block(load_set_block)
      load_set_entity = block_entity(load_set_block)
      load_set_entity_properties = block_loading_fields(load_set_block)

      insert = "WITH inserted_records as (INSERT INTO #{load_set_entity.table_name}(created_by"
      load_set_entity_properties.each do |column|
        insert += ",#{column[:name]}"
      end
      insert += ") "

      load_set_block_record_klass = load_set_block.loading_record_klass
      insert += load_set_block_record_klass.for_confirm.where(record_errors: nil).to_sql
      insert += " RETURNING id) INSERT INTO grit_core_load_set_block_loaded_records(\"record_id\",\"load_set_block_id\",\"table\") SELECT inserted_records.id,#{load_set_block.id}, '#{load_set_entity.table_name}' from inserted_records"

      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute(insert)
      end
    end

    def self.rollback_block(load_set_block)
      load_set_entity = load_set_block.load_set.entity.constantize

      load_set_entity.delete_by("id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = #{load_set_block.id})")
      Grit::Core::LoadSetBlockLoadedRecord.delete_by(load_set_block_id: load_set_block.id)
    end

    def self.mapping_fields(load_set)
      load_set.entity.constantize.entity_fields
    end

    def self.block_mapping_fields(load_set_block)
      load_set_block.load_set.entity.constantize.entity_fields
    end

    def self.block_loading_fields(load_set_block)
      load_set_block.load_set.entity.constantize.entity_fields
    end

    def self.block_entity(load_set_block)
      load_set_block.load_set.entity.constantize
    end

    def self.set_block_data(load_set_block, params)
      load_set_block.separator = params[:separator] unless params[:separator].nil?
      load_set_block.data = params[:data] unless params[:data].nil?
      load_set_block.name = params[:name] unless params[:name].nil?
      load_set_block.status_id = Grit::Core::LoadSetStatus.find_by(name: "Created").id
      ActiveRecord::Base.transaction do
        load_set_block.drop_tables
        load_set_block.save!
      end
      load_set_block
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

    def self.block_entity_info(load_set_block)
      model = load_set_block.load_set.entity.constantize
      {
        full_name: model.name,
        name: model.name.demodulize.underscore.humanize,
        plural: model.name.demodulize.underscore.humanize.pluralize,
        path: model.name.underscore.pluralize,
        dictionary: true
      }
    end

    def self.columns_from_csv(load_set_block)
      load_set_block.data.open do |io|
        line = io.gets
        CSV.parse_line(line, col_sep: load_set_block.separator, liberal_parsing: true, encoding: "utf-8")
          .each_with_index.map { |h,index| { name: "col_#{index}", display_name: h.strip } }
      end
    end

    def self.columns_from_file(load_set_block)
      columns_from_csv(load_set_block)
    end

    def self.records_from_csv(load_set_block)
      load_set_block.data.open do |file|
        file.each_line(chomp: true).with_index do |line, index|
          next if index == 0
          next if line.nil? || line.blank?
          line_with_line_number = "#{index+1}#{load_set_block.separator}#{line}"
          row = CSV.parse_line(line_with_line_number.strip, col_sep: load_set_block.separator).map(&:strip)
          yield CSV.generate_line(row, col_sep: ",")
        end
      end
    end

    def self.records_from_file(load_set_block, &block)
      records_from_csv(load_set_block, &block)
    end
  end
end
