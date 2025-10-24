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
    def self.fields(params)
      load_set_fields = super(params).to_h { |item| [ item[:name], item.dup ] }
      load_set_fields["separator"][:select][:options].push({ label: "Molfile ( $$$$ )", value: "$$$$" }) unless load_set_fields["separator"].nil?
      [ *load_set_fields.values, *Grit::Compounds::CompoundLoadSet.entity_fields ]
    end

    def self.data_set_fields(params)
      self.fields(params).filter { |f| [ "separator", "structure_format" ].include? f[:name] }
    end

    def self.parse(data, separator, structure_format)
      return Grit::Compounds::SDF.parse(data) if structure_format == "molfile"
      super(data, separator)
    end

    def self.show(load_set)
      compound_load_set = Grit::Compounds::CompoundLoadSet.find_by(load_set_id: load_set.id)
      { **compound_load_set.as_json, **load_set.as_json }
    end

    def self.create(params)
      data = read_data(params[:data].tempfile)
      structure_format = params[:structure_format]
      separator = params[:separator]

      parsed_data = self.parse(data, separator, structure_format)

      load_set = Grit::Core::LoadSet.new({
        name: params[:name],
        entity: "Grit::Compounds::Compound",
        data: data,
        separator: separator,
        parsed_data: parsed_data,
        origin_id: params[:origin_id],
        status_id: Grit::Core::LoadSetStatus.find_by(name: "Mapping").id
      })
      load_set.save!

      compound_load_set = Grit::Compounds::CompoundLoadSet.new({
        load_set_id: load_set.id,
        structure_format: structure_format,
        compound_type_id: params[:compound_type_id]
      })
      compound_load_set.save!

      load_set
    end

    def self.destroy(load_set)
      Grit::Compounds::CompoundLoadSet.destroy_by(load_set_id: load_set.id)
      super
    end

    def self.validate(load_set)
      compound_load_set = Grit::Compounds::CompoundLoadSet.find_by(load_set_id: load_set.id)
      load_set_entity_properties = Grit::Compounds::Compound.entity_properties(compound_type_id: compound_load_set.compound_type_id)
      structure_format = compound_load_set.structure_format
      data = load_set.parsed_data[1..]
      errors = []
      warnings = []

      names_origin_ids = []

      Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
      Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)

      data.each_with_index do |datum, index|
        record_props = {}
        record_props["compound_type_id"] = compound_load_set.compound_type_id
        has_errors = false

        ActiveRecord::Base.transaction(requires_new: true) do
          compound_name_origin_id = {}

          record_errors = {}
          loading_record = Grit::Core::LoadSetLoadingRecord.new({
            load_set_id: load_set.id,
            number: index
          })
          loading_record.save!
          load_set_entity_properties.each do |entity_property|
            entity_property_name = entity_property[:name].to_s
            mapping = load_set.mappings[entity_property_name]
            next if mapping.nil?
            find_by = mapping["find_by"]
            header_index = mapping["header"].to_i unless mapping["header"].nil? or mapping["header"].blank?
            value = nil
            if mapping["constant"]
              value = mapping["value"]
            elsif !find_by.blank? and !datum[header_index].blank?
              begin
                field_entity = entity_property[:entity][:full_name].constantize
                value = field_entity.loader_find_by!(find_by, datum[header_index], options: entity_property[:entity][:options]).id
              rescue NameError
                record_errors[entity_property_name] = [ "#{entity_property[:entity][:name]}: No such model" ]
                value = 0
              rescue ActiveRecord::RecordNotFound
                record_errors[entity_property_name] = [ "could not find #{entity_property[:entity][:name]} with '#{find_by}' = #{datum[header_index]}" ]
                value = 0
              end
            elsif !header_index.nil?
              value = datum[header_index]
            end

            if entity_property_name == "origin_id" || entity_property_name == "name"
              compound_name_origin_id[entity_property_name] = value
            end

            loading_record_property_value_props = {
              load_set_id: load_set.id,
              load_set_loading_record_id: loading_record.id,
              name: entity_property[:name]
            }
            if entity_property[:type] == "entity"
              loading_record_property_value_props["entity_id_value"] = value
            elsif entity_property[:type] == "mol"
              loading_record_property_value_props["string_value"] = value
            else
              loading_record_property_value_props["#{entity_property[:type]}_value"] = value
            end

            loading_record_property_value = Grit::Core::LoadSetLoadingRecordPropertyValue.new(loading_record_property_value_props)
            loading_record_property_value.save!

            record_props[entity_property_name] = value
            if entity_property[:required] && value.nil?
              record_errors[entity_property_name] = [ "can't be blank" ]
            elsif (entity_property[:type].to_s == "integer" or entity_property[:type].to_s == "float" or entity_property[:type].to_s == "decimal") and !value.nil? and !value.blank? and !/^[+\-]?(\d+\.\d*|\d*\.\d+|\d+)([eE][+\-]?\d+)?$/.match?(value.to_s)
              record_errors[entity_property_name] = [ "is not a number" ]
            elsif entity_property[:type].to_s == "datetime" and !value.nil? and !value.blank?
              begin
                record_props[entity_property_name] = DateTime.parse(value)
              rescue
                record_errors[entity_property_name] = [ "Unable to parse datetime, please use YYYY/MM/DD HH:mm:ss or ISO 8601" ]
              end
            elsif entity_property[:type].to_s == "date" and !value.nil? and !value.blank?
              begin
                record_props[entity_property_name] = Date.parse(value)
              rescue
                record_errors[entity_property_name] = [ "Unable to parse date, please use YYYY/MM/DD or ISO 8601" ]
              end
            end
          end

          duplicate_names_origin_ids = names_origin_ids.reject { |o| o["name"] != compound_name_origin_id["name"] || o["origin_id"] != compound_name_origin_id["origin_id"] }

          names_origin_ids.push(compound_name_origin_id)

          if duplicate_names_origin_ids.length.positive?
            record_errors["name"] = [ "should be unique per origin (duplicate in file)" ]
          end

          if record_errors.empty?
            compound = Grit::Compounds::Compound.new({
              number: "dummy",
              name: record_props["name"],
              description: record_props["description"],
              origin_id: record_props["origin_id"],
              compound_type_id: record_props["compound_type_id"]
            })

            unless compound.valid?
              errors.push({ index: index, datum: datum, errors: compound.errors })
              has_errors = true
            end
          else
            errors.push({ index: index, datum: datum, errors: record_errors })
            has_errors = true
          end


          unless record_props["molecule"].nil?
            molecule_id = (structure_format == "molfile" ? Grit::Compounds::Molecule.by_molfile(record_props["molecule"]) : Grit::Compounds::Molecule.by_smiles(record_props["molecule"]))&.id
            if molecule_id
              warnings.push({ index: index, loading_record_id: loading_record.id, warnings: { molecule: [ "structure already registered, this compound will be linked to the existing structure" ] } })
            elsif !ActiveRecord::Base.connection.execute(ActiveRecord::Base.send(:sanitize_sql_array, [ "SELECT is_valid_#{structure_format == "molfile" ? "ctab" : "smiles"}(?) as valid", record_props["molecule"] ])).first["valid"]
              errors.push({ index: index, datum: datum, errors: { molecule: [ "is not a valid structure" ] } })
              has_errors = true
            end
          end

          properties_errors = {}

          Grit::Compounds::CompoundProperty.where(compound_type_id: [ record_props["compound_type_id"], nil ]).each do |prop|
            if !record_props[prop.safe_name].nil?
              prop_value = Grit::Compounds::CompoundPropertyValue.new(
                compound_property_id: prop.id,
              )
              value_prop_name = prop.data_type.is_entity ? "entity_id_value" : "#{prop.data_type.name}_value"
              prop_value[value_prop_name] = record_props[prop.safe_name]
              prop_value.property_value
              unless prop_value.errors.blank?
                properties_errors[prop.safe_name] = prop_value.errors[value_prop_name]
              end
            end
          end

          unless properties_errors.empty?
            errors.push({ index: index, datum: datum, errors: properties_errors })
            has_errors = true
          end
          raise ActiveRecord::Rollback if has_errors
        end
      end
      { errors: errors, warnings: warnings }
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

    def self.mapping_fields(load_set)
      compound_load_set = Grit::Compounds::CompoundLoadSet.find_by(load_set_id: load_set.id)
      Grit::Compounds::Compound.entity_fields(compound_type_id: compound_load_set.compound_type_id).filter { |f| ![ "compound_type_id", "molweight", "logp", "molformula", "number" ].include?(f[:name]) }
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
