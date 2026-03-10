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

    def self.block_set_data_fields(params)
      self.block_fields(params).filter { |f| [ "separator", "structure_format" ].include? f[:name] }
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

    def self.validate_block_context(load_set_block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      {
        structure_format: compound_load_set_block.structure_format,
        compound_properties: Grit::Compounds::CompoundProperty.where(compound_type_id: [ compound_load_set_block.compound_type_id, nil ]),
        db_property_names: Grit::Compounds::Compound.db_properties.map { |prop| prop[:name] }
      }
    end

    def self.validate_record(load_set_entity, record, record_props, context)
      has_warnings = false

      if record[:record_errors].nil?
        load_set_entity_record = load_set_entity.new(record_props.select { |key| context[:db_property_names].include?(key) })
        record[:record_errors] = load_set_entity_record.errors unless load_set_entity_record.valid?
      end

      unless record_props["molecule"].blank?
        structure_format = context[:structure_format]
        molecule_id = (structure_format == "molfile" ? Grit::Compounds::Molecule.by_molfile(record_props["molecule"]) : Grit::Compounds::Molecule.by_smiles(record_props["molecule"]))&.id
        if molecule_id
          has_warnings = true
          record[:record_warnings] ||= {}
          record[:record_warnings]["molecule"] = [ "structure already registered, this compound will be linked to the existing structure" ]
        elsif !ActiveRecord::Base.connection.execute(ActiveRecord::Base.send(:sanitize_sql_array, [ "SELECT is_valid_#{structure_format == "molfile" ? "ctab" : "smiles"}(?) as valid", record_props["molecule"] ])).first["valid"]
          record_props["molecule"] = nil
          record[:record_errors] ||= {}
          record[:record_errors]["molecule"] = [ "is not a valid structure" ]
        end
      end

      context[:compound_properties].each do |prop|
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

      { has_warnings: has_warnings }
    end

    def self.confirm_block(load_set_block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      structure_format = compound_load_set_block.structure_format
      compound_type_id = compound_load_set_block.compound_type_id
      compound_properties = Grit::Compounds::CompoundProperty.where(compound_type_id: [ compound_type_id, nil ])

      entity_klass = load_set_block.load_set.entity.constantize
      fields = load_set_block.load_set.entity.constantize.entity_fields

      load_set_block_record_klass = load_set_block.loading_record_klass
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

    def self.rollback_block(load_set_block)
      Grit::Compounds::MoleculesCompound.delete_by("id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = #{load_set_block.id})")
      Grit::Compounds::Molecule.delete_by("id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = #{load_set_block.id})")
      Grit::Compounds::CompoundPropertyValue.delete_by("id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = #{load_set_block.id})")
      Grit::Compounds::Compound.delete_by("id IN (SELECT record_id FROM grit_core_load_set_block_loaded_records WHERE grit_core_load_set_block_loaded_records.load_set_block_id = #{load_set_block.id})")
      Grit::Core::LoadSetBlockLoadedRecord.delete_by(load_set_block_id: load_set_block.id)
    end

    def self.block_mapping_fields(load_set_block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      Grit::Compounds::Compound.entity_fields(compound_type_id: compound_load_set_block.compound_type_id).filter { |f| ![ "compound_type_id", "molweight", "logp", "molformula", "number" ].include?(f[:name]) }
    end

    def self.block_loading_fields(load_set_block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      Grit::Compounds::Compound.entity_fields(compound_type_id: compound_load_set_block.compound_type_id)
        .filter { |f| ![ "molweight", "logp", "molformula", "number" ].include?(f[:name]) }
        .map { |f| f[:type] == "mol" ? { **f, type: "text" } : f }
    end

    def self.set_block_data(load_set_block, params)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      ActiveRecord::Base.transaction do
        load_set_block.separator = params[:separator] unless params[:separator].nil?
        compound_load_set_block.structure_format = params[:structure_format] unless params[:structure_format].nil?
        load_set_block.data = params[:data] unless params[:data].nil?
        load_set_block.name = params[:name] unless params[:name].nil?
        load_set_block.status_id = Grit::Core::LoadSetStatus.find_by(name: "Created").id
        load_set_block.has_errors = false
        load_set_block.has_warnings = false
        load_set_block.drop_tables
        load_set_block.save!
        compound_load_set_block.save!
      end
      load_set_block
    end


    def self.columns_from_sdf(load_set_block)
      load_set_block.data.open do |io|
        Grit::Compounds::SDF.properties(io)
          .each_with_index.map { |h, index| { name: "col_#{index}", display_name: h.strip } }
      end
    end

    def self.columns_from_file(load_set_block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      return columns_from_sdf(load_set_block) if compound_load_set_block.structure_format == "molfile"
      columns_from_csv(load_set_block)
    end

    def self.records_from_sdf(load_set_block, &block)
      load_set_block.data.open do |file|
        Grit::Compounds::SDF.each_record(file) do |record, recordno|
          row = load_set_block.headers.map { |h| record[h["display_name"]] }
          next if row.compact.blank?
          row_with_record_number = [ recordno, *row ]
          yield CSV.generate_line(row_with_record_number, col_sep: ",")
        end
      end
    end

    def self.records_from_file(load_set_block, &block)
      compound_load_set_block = Grit::Compounds::CompoundLoadSetBlock.find_by(load_set_block_id: load_set_block.id)
      return records_from_sdf(load_set_block, &block) if compound_load_set_block.structure_format == "molfile"
      records_from_csv(load_set_block, &block)
    end
  end
end
