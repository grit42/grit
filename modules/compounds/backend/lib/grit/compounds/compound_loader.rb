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
require "grit/compounds/sdf"

module Grit::Compounds
  class CompoundLoader < Grit::Core::EntityLoader
    protected
    def self.block_fields(params)
      load_set_block_fields = super(params).to_h { |item| [ item[:name], item.dup ] }
      load_set_block_fields["separator"][:select][:options].push({ label: "Molfile ( $$$$ )", value: "$$$$" }) unless load_set_block_fields["separator"].nil?
      [ *load_set_block_fields.values, *Grit::Compounds::CompoundLoadSetBlock.entity_fields ]
    end

    def self.parse(data, separator, structure_format)
      return Grit::Compounds::SDF.parse(data) if structure_format == "molfile"
      super(data, separator)
    end

    def self.create(params)
      load_set = super

      Grit::Compounds::CompoundLoadSetBlock.create!({
        load_set_block_id: load_set.load_set_blocks[0].id,
        compound_type_id: params[:load_set_blocks]["0"]["compound_type_id"],
        structure_format: params[:load_set_blocks]["0"]["structure_format"]
      })

      load_set
    end

    def self.show(load_set)
      load_set_blocks = Grit::Core::LoadSetBlock
        .detailed
        .select("grit_compounds_compound_load_set_blocks.compound_type_id")
        .select("grit_compounds_compound_load_set_blocks.structure_format")
        .joins("JOIN grit_compounds_compound_load_set_blocks on grit_compounds_compound_load_set_blocks.load_set_block_id = grit_core_load_set_blocks.id")
        .where(load_set_id: load_set.id)
      return load_set.as_json if load_set_blocks.empty?
      { **load_set.as_json, load_set_blocks: load_set_blocks }
    end

    def self.destroy(load_set)
      Grit::Compounds::CompoundLoadSetBlock.destroy_by(load_set_block_id: load_set.load_set_blocks.map { |b| b.id })
      super
    end

    def self.base_record_props(load_set_block)
      { "compound_type_id" => Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id).compound_type_id }
    end

    def self.validate_block(load_set_block)
      load_set_block.truncate_loading_records_table

      load_set_entity = block_entity(load_set_block)
      load_set_entity_properties = block_mapping_fields(load_set_block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      structure_format = compound_load_set_block.structure_format
      compound_type_id = compound_load_set_block.compound_type_id
      compound_properties = Grit::Compounds::CompoundProperty.where(compound_type_id: [ compound_type_id, nil ])

      load_set_block_record_klass = load_set_block.record_klass

      errors = []
      records = []
      unique_properties = {}

      new_record_props = base_record_props(load_set_block)

      load_set_block.preview_data.each do |datum|
        compound_name_origin_id = {}

        record = {
          line: datum[:line],
          datum: datum,
          record_errors: nil
        }

        record_props = new_record_props.dup

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

          if entity_property_name == "origin_id" || entity_property_name == "name"
            compound_name_origin_id[entity_property_name] = value
          end

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
            unique_properties[entity_property_name] ||= []

            duplicate_values = unique_properties[entity_property_name].select { |o| o == value }

            if duplicate_values.length.positive?
              record[:record_errors] ||= {}
              record[:record_errors][entity_property_name] = [ "should be unique (duplicate in file)" ]
            else
              unique_properties[entity_property_name].push(value)
            end
          end
        end

        unique_properties["name_origin_id"] ||= []

        duplicate_values = unique_properties["name_origin_id"].reject { |o| o["name"] != compound_name_origin_id["name"] || o["origin_id"] != compound_name_origin_id["origin_id"] }

        if duplicate_values.length.positive?
          record[:record_errors] ||= {}
          record[:record_errors]["name"] = [ "should be unique (duplicate in file)" ]
        else
          unique_properties["name_origin_id"].push(compound_name_origin_id)
        end

        if record[:record_errors].nil?
          db_property_names = Grit::Compounds::Compound.db_properties.map { |prop| prop[:name] }
          load_set_entity_record = load_set_entity.new(record_props.select { |key| db_property_names.include?(key) })
          record[:record_errors] = load_set_entity_record.errors unless load_set_entity_record.valid?
        end

        unless record_props["molecule"].nil?
          molecule_id = (structure_format == "molfile" ? Grit::Compounds::Molecule.by_molfile(record_props["molecule"]) : Grit::Compounds::Molecule.by_smiles(record_props["molecule"]))&.id
          if molecule_id
            record[:record_warnings] ||= {}
            record[:record_warnings]["molecule"] = [ "structure already registered, this compound will be linked to the existing structure" ]
          elsif !ActiveRecord::Base.connection.execute(ActiveRecord::Base.send(:sanitize_sql_array, [ "SELECT is_valid_#{structure_format == "molfile" ? "ctab" : "smiles"}(?) as valid", record_props["molecule"] ])).first["valid"]
            record_props["molecule"] = nil
            record[:record_errors] ||= {}
            record[:record_errors]["molecule"] = [ "is not a valid structure" ]
          end
        end

        compound_properties.each do |prop|
          unless record_props[prop.safe_name].nil?
            prop_value = Grit::Compounds::CompoundPropertyValue.new(
              compound_property_id: prop.id,
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
          errors.push({ line: datum[:line], datum: datum, errors: record[:record_errors] })
        end
        records.push({ **record, **record_props })
      end
      load_set_block_record_klass.insert_all(records)
      { errors: errors }
    end

    def self.confirm_block(load_set_block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      structure_format = compound_load_set_block.structure_format
      compound_type_id = compound_load_set_block.compound_type_id
      compound_properties = Grit::Compounds::CompoundProperty.where(compound_type_id: [ compound_type_id, nil ])

      entity_klass = load_set_block.load_set.entity.constantize
      fields = load_set_block.load_set.entity.constantize.entity_fields

      load_set_block_record_klass = load_set_block.record_klass
      ActiveRecord::Base.transaction do
        load_set_block_record_klass.for_confirm.where(record_errors: nil).each do |record|
          record_ids = Grit::Compounds::Compound.create(record, structure_format)

          Grit::Core::LoadSetBlockLoadedRecord.create!({
            load_set_block_id: load_set_block.id,
            table: "grit_compounds_compounds",
            record_id: record_ids[:compound_id]
          })

          Grit::Core::LoadSetBlockLoadedRecord.create!({
            load_set_block_id: load_set_block.id,
            table: "grit_compounds_molecules",
            record_id: record_ids[:molecule_id]
          }) unless record_ids[:molecule_id].nil?

          Grit::Core::LoadSetBlockLoadedRecord.create!({
            load_set_block_id: load_set_block.id,
            table: "grit_compounds_molecules_compounds",
            record_id: record_ids[:molecules_compound_id]
          }) unless record_ids[:molecules_compound_id].nil?

          record_ids[:compound_property_value_ids].each do |compound_property_value_id|
            Grit::Core::LoadSetBlockLoadedRecord.create!({
              load_set_block_id: load_set_block.id,
              table: "grit_compounds_compound_property_values",
              record_id: compound_property_value_id
            })
          end
        end
      end
    end

    def self.confirm(load_set)
      compound_load_set = Grit::Compounds::CompoundLoadSet.find_by(load_set_id: load_set.id)
      load_set_entity_properties = Grit::Compounds::Compound.entity_properties(compound_type_id: compound_load_set.compound_type_id)

      ActiveRecord::Base.transaction do
        Grit::Core::LoadSetLoadingRecord.includes(:load_set_loading_record_property_values).where(load_set_id: load_set.id).each do |loading_record|
          record_props = {}
          record_props["compound_type_id"] = compound_load_set.compound_type_id
          loading_record.load_set_loading_record_property_values.each do |loading_record_property_value|
            entity_property = load_set_entity_properties.find { |p| p[:name] == loading_record_property_value.name }
            if entity_property[:type] == "entity"
              record_props[loading_record_property_value.name] = loading_record_property_value.entity_id_value
            elsif entity_property[:type] == "mol"
              record_props[loading_record_property_value.name] = loading_record_property_value.string_value
            else
              record_props[loading_record_property_value.name] = loading_record_property_value["#{entity_property[:type]}_value"]
            end
          end

          record_ids = Grit::Compounds::Compound.create(record_props, compound_load_set.structure_format)

          Grit::Core::LoadSetLoadedRecord.new({
            load_set_id: load_set.id,
            table: "grit_compounds_compounds",
            record_id: record_ids[:compound_id]
          }).save!

          Grit::Core::LoadSetLoadedRecord.new({
            load_set_id: load_set.id,
            table: "grit_compounds_molecules",
            record_id: record_ids[:molecule_id]
          }).save! unless record_ids[:molecule_id].nil?

          Grit::Core::LoadSetLoadedRecord.new({
            load_set_id: load_set.id,
            table: "grit_compounds_molecules_compounds",
            record_id: record_ids[:molecules_compound_id]
          }).save! unless record_ids[:molecules_compound_id].nil?

          record_ids[:compound_property_value_ids].each do |compound_property_value_id|
            Grit::Core::LoadSetLoadedRecord.new({
              load_set_id: load_set.id,
              table: "grit_compounds_compound_property_values",
              record_id: compound_property_value_id
            }).save!
          end
        end

        Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
        Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)
      end
    end

    def self.block_mapping_fields(load_set_block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      Grit::Compounds::Compound.entity_fields(compound_type_id: compound_load_set_block.compound_type_id).filter { |f| ![ "compound_type_id", "molweight", "logp", "molformula", "number" ].include?(f[:name]) }
    end

    def self.block_loading_fields(load_set_block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      Grit::Compounds::Compound.entity_fields(compound_type_id: compound_load_set_block.compound_type_id).filter { |f| ![ "molweight", "logp", "molformula", "number" ].include?(f[:name]) }
    end

    def self.set_data(load_set, tempfile, **args)
      data = read_data(tempfile)
      compound_load_set = Grit::Compounds::CompoundLoadSet.find_by(load_set_id: load_set.id)
      parsed_data = self.parse(data, args[:separator], args[:structure_format] || compound_load_set.structure_format)
      load_set.data = data
      load_set.separator = args[:separator]
      load_set.parsed_data = parsed_data
      load_set.status_id = Grit::Core::LoadSetStatus.find_by(name: "Mapping").id
      load_set.record_errors = nil
      load_set.record_warnings = nil

      compound_load_set.structure_format = args[:structure_format] unless args[:structure_format].nil?

      ActiveRecord::Base.transaction do
        Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
        Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)
        load_set.save!
        compound_load_set.save!
      end
      load_set
    end
  end
end
