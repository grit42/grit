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
    def self.fields(params)
      [ *Grit::Core::LoadSet.entity_fields.filter { |f| f[:id] != "data" }, *Grit::Compounds::BatchLoadSet.entity_fields ]
    end

    def self.create(params)
      data = params[:data].tempfile.read

      parsed_data = self.parse(data, params[:separator])

      load_set = Grit::Core::LoadSet.new({
        name: params[:name],
        entity: "Grit::Compounds::Batch",
        data: data,
        separator: params[:separator],
        parsed_data: parsed_data,
        origin_id: params[:origin_id],
        status_id: Grit::Core::LoadSetStatus.find_by(name: "Mapping").id
      })
      load_set.save!

      batch_load_set = Grit::Compounds::BatchLoadSet.new({
        load_set_id: load_set.id,
        compound_type_id: params[:compound_type_id]
      })
      batch_load_set.save!

      load_set
    end

    def self.destroy(load_set)
      Grit::Compounds::BatchLoadSet.destroy_by(load_set_id: load_set.id)
      super
    end

    def self.validate(load_set)
      batch_load_set = Grit::Compounds::BatchLoadSet.find_by(load_set_id: load_set.id)
      load_set_entity_properties = Grit::Compounds::Batch.entity_properties(compound_type_id: batch_load_set.compound_type_id)
      data = load_set.parsed_data[1..]
      errors = []

      names_compound_ids = []

      Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
      Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)

      data.each_with_index do |datum, index|
        record_props = {}
        record_props["compound_type_id"] = batch_load_set.compound_type_id
        has_errors = false

        ActiveRecord::Base.transaction(requires_new: true) do
          name_compound_id = {}

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
            elsif !find_by.blank?
              begin
                field_entity = entity_property[:entity][:full_name].constantize
                value = field_entity.loader_find_by!(find_by, datum[header_index]).id
              rescue NameError
                record_errors[entity_property_name] = [ "#{entity_property[:entity][:full_name]}: No such model" ]
                value = 0
              rescue ActiveRecord::RecordNotFound
                record_errors[entity_property_name] = [ "could not find #{entity_property[:entity][:full_name]} with '#{find_by}' = #{datum[header_index]}" ]
                value = 0
              end
            elsif !header_index.nil?
              value = datum[header_index]
            end

            if entity_property_name == "name" || entity_property_name == "compound_id"
              name_compound_id[entity_property_name] = value
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

          duplicate_names_compound_ids = names_compound_ids.reject { |o| o["name"] != name_compound_id["name"] || o["compound_id"] != name_compound_id["compound_id"] }

          names_compound_ids.push(name_compound_id)

          if duplicate_names_compound_ids.length.positive?
            record_errors["name"] = [ "should be unique per compound (duplicate in file)" ]
          end

          if record_errors.empty?
            batch = Grit::Compounds::Batch.new({
              name: record_props["name"],
              description: record_props["description"],
              origin_id: record_props["origin_id"],
              compound_type_id: record_props["compound_type_id"],
              compound_id: record_props["compound_id"]
            })

            unless batch.valid?
              errors.push({ index: index, datum: datum, errors: batch.errors })
              has_errors = true
            end
          else
            errors.push({ index: index, datum: datum, errors: record_errors })
            has_errors = true
          end

          properties_errors = {}

          Grit::Compounds::BatchProperty.where(compound_type_id: [ record_props["compound_type_id"], nil ]).each do |prop|
            if !record_props[prop.safe_name].nil?
              prop_value = Grit::Compounds::BatchPropertyValue.new(
                batch_property_id: prop.id,
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
      { errors: errors }
    end

    def self.confirm(load_set)
      batch_load_set = Grit::Compounds::BatchLoadSet.find_by(load_set_id: load_set.id)
      load_set_entity_properties = Grit::Compounds::Batch.entity_properties(compound_type_id: batch_load_set.compound_type_id)

      ActiveRecord::Base.transaction do
        Grit::Core::LoadSetLoadingRecord.includes(:load_set_loading_record_property_values).where(load_set_id: load_set.id).each do |loading_record|
          record_props = {}
          record_props["compound_type_id"] = batch_load_set.compound_type_id
          loading_record.load_set_loading_record_property_values.each do |loading_record_property_value|
            entity_property = load_set_entity_properties.find { |p| p[:name] == loading_record_property_value.name }
            if entity_property[:type] == "entity"
              record_props[loading_record_property_value.name] = loading_record_property_value.entity_id_value
            else
              record_props[loading_record_property_value.name] = loading_record_property_value["#{entity_property[:type]}_value"]
            end
          end

          record_ids = Grit::Compounds::Batch.create(record_props)

          Grit::Core::LoadSetLoadedRecord.new({
            load_set_id: load_set.id,
            table: "grit_compounds_batches",
            record_id: record_ids[:batch_id]
          }).save!

          record_ids[:batch_property_value_ids].each do |batch_property_value_id|
            Grit::Core::LoadSetLoadedRecord.new({
              load_set_id: load_set.id,
              table: "grit_compounds_batch_property_values",
              record_id: batch_property_value_id
            }).save!
          end
        end

        Grit::Core::LoadSetLoadingRecordPropertyValue.delete_by(load_set_id: load_set.id)
        Grit::Core::LoadSetLoadingRecord.delete_by(load_set_id: load_set.id)
      end
    end

    def self.mapping_fields(load_set)
      batch_load_set = Grit::Compounds::BatchLoadSet.find_by(load_set_id: load_set.id)
      Grit::Compounds::Batch.entity_fields(compound_type_id: batch_load_set.compound_type_id).filter { |f| ![ "compound_type_id", "number" ].include?(f[:name]) }
    end
  end
end
