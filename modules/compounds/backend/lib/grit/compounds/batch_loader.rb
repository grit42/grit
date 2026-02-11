#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-compounds.
#
# grit-compounds is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-compounds is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-compounds. If not, see <https://www.gnu.org/licenses/>.
#++

require "grit/core/entity_loader"

module Grit::Compounds
  class BatchLoader < Grit::Core::EntityLoader
    protected
    def self.block_fields(params)
      [ *super(params), *Grit::Compounds::BatchLoadSetBlock.entity_fields ]
    end

    def self.create(params)
      load_set = super

      Grit::Compounds::BatchLoadSetBlock.create!({
        load_set_block_id: load_set.load_set_blocks[0].id,
        compound_type_id: params[:load_set_blocks]["0"]["compound_type_id"],
      })

      load_set
    end

    def self.show(load_set)
      load_set_blocks = Grit::Core::LoadSetBlock
        .detailed
        .select("grit_compounds_batch_load_set_blocks.compound_type_id")
        .joins("LEFT OUTER JOIN grit_compounds_batch_load_set_blocks on grit_compounds_batch_load_set_blocks.load_set_block_id = grit_core_load_set_blocks.id")
        .where(load_set_id: load_set.id)
      return load_set.as_json if load_set_blocks.empty?
      { **load_set.as_json, load_set_blocks: load_set_blocks }
    end

    def self.destroy(load_set)
      Grit::Compounds::BatchLoadSetBlock.destroy_by(load_set_block_id: load_set.load_set_blocks.map { |b| b.id })
      super
    end

    def self.base_record_props(load_set_block)
      { "compound_type_id" => Grit::Compounds::BatchLoadSetBlock.find_by(load_set_block_id: load_set_block.id).compound_type_id }
    end

    def self.validate_block(load_set_block)
      load_set_block.truncate_loading_records_table

      load_set_entity = block_entity(load_set_block)
      load_set_entity_properties = block_mapping_fields(load_set_block)
      batch_load_set_block = Grit::Compounds::BatchLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      compound_type_id = batch_load_set_block.compound_type_id
      batch_properties = Grit::Compounds::BatchProperty.where(compound_type_id: [ compound_type_id, nil ])
      db_property_names = Grit::Compounds::Batch.db_properties.map { |prop| prop[:name] }

      load_set_block_record_klass = load_set_block.loading_record_klass

      records = []
      unique_properties = Hash.new { |h, k| h[k] = Set.new }
      has_errors = false

      new_record_props = base_record_props(load_set_block)

      load_set_block.preview_data.find_each do |datum|
        record = {
          line: datum[:line],
          record_errors: nil
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
            record[:record_errors] ||= {}
            record[:record_errors][entity_property_name] = [ "can't be blank" ]
          elsif entity_property[:type].to_s == "decimal" and value.present? and !/^[+\-]?(\d+\.\d*|\d*\.\d+|\d+)([eE][+\-]?\d+)?$/.match?(value.to_s)
            record_props[entity_property_name] = nil
            value = nil
            record[:record_errors] ||= {}
            record[:record_errors][entity_property_name] = [ "is not a number" ]
          elsif entity_property[:type].to_s == "integer" and value.present? and !/^[+\-]?\d+([eE][+]?\d+)?$/.match?(value.to_s)
            record_props[entity_property_name] = nil
            value = nil
            record[:record_errors] ||= {}
            record[:record_errors][entity_property_name] = [ "is not a integer" ]
          elsif entity_property[:type].to_s == "integer" and value.present? and (value.to_i < -(2**53-1) || value.to_i > 2**53-1)
            record_props[entity_property_name] = nil
            value = nil
            record[:record_errors] ||= {}
            record[:record_errors][entity_property_name] = [ "is out of range" ]
          elsif entity_property[:type].to_s == "datetime" and value.present?
            begin
              record_props[entity_property_name] = DateTime.parse(value)
            rescue ArgumentError
              record_props[entity_property_name] = nil
              value = nil
              record[:record_errors] ||= {}
              record[:record_errors][entity_property_name] = [ "Unable to parse datetime, please use YYYY/MM/DD HH:mm:ss or ISO 8601" ]
            end
          elsif entity_property[:type].to_s == "date" and value.present?
            begin
              record_props[entity_property_name] = Date.parse(value)
            rescue ArgumentError
              record_props[entity_property_name] = nil
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
          load_set_entity_record = load_set_entity.new(record_props.select { |key| db_property_names.include?(key) })
          record[:record_errors] = load_set_entity_record.errors unless load_set_entity_record.valid?
        end

        batch_properties.each do |prop|
          unless record_props[prop.safe_name].nil?
            prop_value = Grit::Compounds::BatchPropertyValue.new(
              batch_property_id: prop.id,
            )
            value_prop_name = prop.data_type.is_entity ? "entity_id_value" : "#{prop.data_type.name}_value"
            prop_value[value_prop_name] = record_props[prop.safe_name]
            prop_value.property_value
            unless prop_value.errors.blank?
              record[:record_errors] ||= {}
              record[:record_errors][prop.safe_name] = prop_value.errors[value_prop_name]
            end
          end
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
      { has_errors: has_errors, has_warnings: false }
    end

    def self.confirm_block(load_set_block)
      batch_load_set_block = Grit::Compounds::BatchLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      compound_type_id = batch_load_set_block.compound_type_id
      batch_properties = Grit::Compounds::BatchProperty.where(compound_type_id: [ compound_type_id, nil ])

      entity_klass = load_set_block.load_set.entity.constantize
      fields = load_set_block.load_set.entity.constantize.entity_fields

      load_set_block_record_klass = load_set_block.loading_record_klass
      ActiveRecord::Base.transaction do
        load_set_block_record_klass.for_confirm.where(record_errors: nil).each do |record|
          record_ids = Grit::Compounds::Batch.create(record)

          Grit::Core::LoadSetBlockLoadedRecord.create!({
            load_set_block_id: load_set_block.id,
            table: "grit_compounds_batches",
            record_id: record_ids[:batch_id]
          })

          record_ids[:batch_property_value_ids].each do |batch_property_value_id|
            Grit::Core::LoadSetBlockLoadedRecord.create!({
              load_set_block_id: load_set_block.id,
              table: "grit_compounds_batch_property_values",
              record_id: batch_property_value_id
            })
          end
        end
      end
    end

    def self.rollback_block(load_set_block)
      Grit::Compounds::BatchPropertyValue.delete_by("id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = #{load_set_block.id})")
      Grit::Compounds::Batch.delete_by("id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = #{load_set_block.id})")
      Grit::Core::LoadSetBlockLoadedRecord.delete_by(load_set_block_id: load_set_block.id)
    end

    def self.block_mapping_fields(load_set_block)
      batch_load_set_block = Grit::Compounds::BatchLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      Grit::Compounds::Batch.entity_fields(compound_type_id: batch_load_set_block.compound_type_id).filter { |f| ![ "compound_type_id", "molweight", "logp", "molformula", "number" ].include?(f[:name]) }
    end

    def self.block_loading_fields(load_set_block)
      batch_load_set_block = Grit::Compounds::BatchLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      Grit::Compounds::Batch.entity_fields(compound_type_id: batch_load_set_block.compound_type_id)
        .filter { |f| ![ "number" ].include?(f[:name]) }
    end
  end
end
