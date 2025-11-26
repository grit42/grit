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

module Grit::Compounds
  class Batch < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :compound_type
    belongs_to :compound
    has_many :batch_property_values, dependent: :destroy
    belongs_to :origin, class_name: "Grit::Core::Origin"

    display_columns [ "number", "name" ]

    entity_crud_with read: [],
      create: [ "Administrator", "CompoundAdministrator", "CompoundUser" ],
      update: [ "Administrator", "CompoundAdministrator", "CompoundUser" ],
      destroy: [ "Administrator", "CompoundAdministrator", "CompoundUser" ]

    class_eval do
      _validators.delete("number")

      _validate_callbacks.each do |callback|
        if callback.filter.respond_to? :attributes
          callback.filter.attributes.delete "number"
        end
      end
    end

    before_create :set_number

    def self.create(params)
      ActiveRecord::Base.transaction do
        batch_property_value_ids = []

        batch = Grit::Compounds::Batch.new({
          name: params["name"],
          description: params["description"],
          origin_id: params["origin_id"],
          compound_type_id: params["compound_type_id"],
          compound_id: params["compound_id"]
        })

        batch.save!

        Grit::Compounds::BatchProperty.where(compound_type_id: [ batch.compound_type_id, nil ]).each do |prop|
          if !params[prop.safe_name].nil?
            prop_value = Grit::Compounds::BatchPropertyValue.new(
              batch_id: batch.id,
              batch_property_id: prop.id,
            )
            if prop.data_type.is_entity
              prop_value.entity_id_value = params[prop.safe_name]
            else
              prop_value["#{prop.data_type.name}_value"] = params[prop.safe_name]
            end
            prop_value.save!
            batch_property_value_ids.push prop_value.id
          end
        end
        { batch_id: batch.id, batch_property_value_ids: batch_property_value_ids }
      end
    end

    def self.compound_type_properties(**args)
      compound_type_id = args[:compound_type_id]
      compound_type_ids = args[:compound_type_ids]
      compound_type_ids ||= [ compound_type_id ] unless compound_type_id.nil?

      types_properties = Grit::Compounds::BatchProperty.detailed.order("sort ASC NULLS LAST")
      types_properties = types_properties.where(compound_type_id: [ *compound_type_ids, nil ]) unless compound_type_ids.nil?
      types_properties.map do |type_property|
        property = {
          name: type_property.safe_name,
          display_name: type_property.name,
          description: type_property.description,
          type: type_property.data_type.is_entity ? "entity" : type_property.data_type.name,
          required: type_property.required,
          unique: false,
          compound_type_id: type_property.compound_type_id,
          compound_type_id__name: type_property.compound_type&.name,
          entity: type_property.data_type.entity_definition
        }
        property
      end
    end

    def self.entity_properties(**args)
      [ *self.db_properties.map { |p| { **p, compound_type_id: nil, compound_type_id__name: nil } }, *self.compound_type_properties(**args) ]
    end

    def self.entity_fields(**args)
      self.entity_fields_from_properties(self.entity_properties(**args))
    end

    def self.entity_columns(**args)
      self.entity_columns_from_properties(self.entity_properties(**args))
    end

    def self.detailed(params = nil)
      query = self.unscoped
      .select("grit_compounds_batches.id")
      .select("grit_compounds_batches.created_by")
      .select("grit_compounds_batches.updated_by")
      .select("grit_compounds_batches.created_at")
      .select("grit_compounds_batches.updated_at")
      .select("grit_compounds_batches.number")
      .select("grit_compounds_batches.name")
      .select("grit_compounds_batches.description")
      .select("grit_compounds_batches.compound_id")
      .select("grit_compounds_batches.compound_type_id")
      .select("grit_compounds_batches.origin_id")
      .select("grit_compounds_compounds__.number as compound_id__number")
      .select("grit_compounds_compounds__.name as compound_id__name")
      .select("grit_core_origins__.name as origin_id__name")
      .select("grit_compounds_compound_types__.name as compound_type_id__name")
      .joins("LEFT OUTER JOIN grit_compounds_compounds grit_compounds_compounds__ ON grit_compounds_batches.compound_id = grit_compounds_compounds__.id")
      .joins("LEFT OUTER JOIN grit_compounds_compound_types grit_compounds_compound_types__ ON grit_compounds_batches.compound_type_id = grit_compounds_compound_types__.id")
      .joins("LEFT OUTER JOIN grit_core_origins grit_core_origins__ ON grit_compounds_batches.origin_id = grit_core_origins__.id")

      BatchProperty.all.each do |property|
        query = query
          .joins("LEFT OUTER JOIN grit_compounds_batch_property_values bpv__#{property.safe_name} on bpv__#{property.safe_name}.batch_property_id = #{property.id} and bpv__#{property.safe_name}.batch_id = grit_compounds_batches.id")

        if property.data_type.is_entity
          entity_klass = property.data_type.model
          query = query
            .joins("LEFT OUTER JOIN #{property.data_type.table_name} dt__#{property.safe_name} on dt__#{property.safe_name}.id = bpv__#{property.safe_name}.entity_id_value")
            .select("bpv__#{property.safe_name}.entity_id_value as #{property.safe_name}")
          entity_klass.display_properties&.each do |display_property|
            query = query
            .select("dt__#{property.safe_name}.#{display_property[:name]} as #{property.safe_name}__#{display_property[:name]}")
          end
        else
          query = query.select("bpv__#{property.safe_name}.#{property.data_type.name}_value as #{property.safe_name}")
        end
      end
      query
    end

    def set_number
      self.number = ActiveRecord::Base.connection.execute("SELECT concat('BATCH', LPAD((nextval('public.grit_compounds_batch_seq'::regclass))::text, 7, '0')) as number").first["number"]
    end
  end
end
