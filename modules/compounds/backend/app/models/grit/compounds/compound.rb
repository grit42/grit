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
  class Compound < ApplicationRecord
    include Grit::Core::GritEntityRecord

    belongs_to :compound_type
    belongs_to :origin, class_name: "Grit::Core::Origin"

    has_many :synonym, dependent: :destroy
    has_many :batch, dependent: :destroy
    has_many :compound_property_values, dependent: :destroy
    has_one :molecules_compound, required: false, dependent: :destroy

    display_columns [ "number", "name" ]


    entity_crud_with read: [],
      create: [ "Administrator", "CompoundAdministrator", "CompoundUser" ],
      update: [ "Administrator", "CompoundAdministrator", "CompoundUser" ],
      destroy: [ "Administrator", "CompoundAdministrator", "CompoundUser" ]

    validate :no_synonyms_with_name

    def no_synonyms_with_name
      errors.add("name", "has already been taken") if Synonym.unscoped.where(name: self.name).count(:all).positive?
    end

    class_eval do
      _validators.delete("number")

      _validate_callbacks.each do |callback|
        if callback.filter.respond_to? :attributes
          callback.filter.attributes.delete "number"
        end
      end
    end

    before_create :set_number

    def self.create(params, structure_format = "molfile")
      ActiveRecord::Base.transaction do
        molecule_id = nil
        molecules_compound_id = nil
        compound_property_value_ids = []

        compound = Grit::Compounds::Compound.new({
          name: params["name"],
          description: params["description"],
          origin_id: params["origin_id"],
          compound_type_id: params["compound_type_id"]
        })

        compound.save!

        unless params["molecule"].nil?
          molecule_id = (structure_format=="molfile" ? Grit::Compounds::Molecule.by_molfile(params["molecule"]) : Grit::Compounds::Molecule.by_smiles(params["molecule"]))&.id
          if molecule_id.nil?
            molfile = params["molecule"]
            molfile = Grit::Compounds::Molecule.molfile_from_smiles(params["molecule"]) if structure_format == "smiles"
            molecule_record = Grit::Compounds::Molecule.new({
              molfile: molfile
            })
            molecule_record.save!
            molecule_id = molecule_record.id
            molecule_id = molecule_record.id
          end
          molecule_compound_record = Grit::Compounds::MoleculesCompound.new({
            molecule_id: molecule_id,
            compound_id: compound.id
          })
          molecule_compound_record.save!
          molecules_compound_id = molecule_compound_record.id
        end

        Grit::Compounds::CompoundProperty.where(compound_type_id: [ compound.compound_type_id, nil ]).each do |prop|
          if !params[prop.safe_name].nil?
            prop_value = Grit::Compounds::CompoundPropertyValue.new(
              compound_id: compound.id,
              compound_property_id: prop.id,
            )
            if prop.data_type.is_entity
              prop_value.entity_id_value = params[prop.safe_name]
            else
              prop_value["#{prop.data_type.name}_value"] = params[prop.safe_name]
            end
            prop_value.save!
            compound_property_value_ids.push prop_value.id
          end
        end
        { compound_id: compound.id, molecule_id: molecule_id, molecules_compound_id: molecules_compound_id, compound_property_value_ids: compound_property_value_ids }
      end
    end

    def self.compound_type_properties(**args)
      compound_type_id = args[:compound_type_id]
      compound_type_ids = args[:compound_type_ids]
      compound_type_ids ||= [ compound_type_id ] unless compound_type_id.nil?

      types_properties = Grit::Compounds::CompoundProperty.detailed.order("sort ASC NULLS LAST")
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
      compound_type_id = args[:compound_type_id]
      compound_type_ids = args[:compound_type_ids]
      compound_type_ids ||= [ compound_type_id ] unless compound_type_id.nil?
      properties = self.db_properties.map { |p| { **p, compound_type_id: nil, compound_type_id__name: nil } }

      show_structure_properties = compound_type_ids.nil? ? Grit::Compounds::CompoundType.where(has_structure: true).count > 0 : Grit::Compounds::CompoundType.where(id: compound_type_ids, has_structure: true).count > 0

      if show_structure_properties
        properties = [
          {
            name: "molecule",
            display_name: "Molecule",
            type: "mol",
            limit: nil,
            required: false,
            unique: false,
            default: nil,
            entity: nil,
            compound_type_id: nil,
            compound_type_id__name: nil
          },
          *properties,
          {
          name: "molweight",
          display_name: "MW",
          type: "decimal",
          limit: nil,
          required: false,
          unique: false,
          default: nil,
          entity: nil,
          disabled: true,
          compound_type_id: nil,
          compound_type_id__name: nil
        }, {
          name: "logp",
          display_name: "LogP",
          type: "decimal",
          limit: nil,
          required: false,
          unique: false,
          default: nil,
          entity: nil,
          disabled: true,
          compound_type_id: nil,
          compound_type_id__name: nil
        }, {
          name: "molformula",
          display_name: "Molecular formula",
          type: "string",
          limit: nil,
          required: false,
          unique: false,
          default: nil,
          entity: nil,
          disabled: true,
          compound_type_id: nil,
          compound_type_id__name: nil
        },
        {
          name: "smiles",
          display_name: "Canonical SMILES",
          type: "string",
          limit: nil,
          required: false,
          unique: false,
          default: nil,
          entity: nil,
          disabled: true,
          compound_type_id: nil,
          compound_type_id__name: nil
        },
        {
          name: "inchi",
          display_name: "InChI",
          type: "string",
          limit: nil,
          required: false,
          unique: false,
          default: nil,
          entity: nil,
          disabled: true,
          compound_type_id: nil,
          compound_type_id__name: nil
        },
        {
          name: "inchikey",
          display_name: "InChI Key",
          type: "string",
          limit: nil,
          required: false,
          unique: false,
          default: nil,
          entity: nil,
          disabled: true,
          compound_type_id: nil,
          compound_type_id__name: nil
        },
        {
          name: "hba",
          display_name: "Hydrogen Bond Acceptor Count",
          type: "decimal",
          limit: nil,
          required: false,
          unique: false,
          default: nil,
          entity: nil,
          disabled: true,
          compound_type_id: nil,
          compound_type_id__name: nil
        },
        {
          name: "hbd",
          display_name: "Hydrogen Bond Donor Count",
          type: "decimal",
          limit: nil,
          required: false,
          unique: false,
          default: nil,
          entity: nil,
          disabled: true,
          compound_type_id: nil,
          compound_type_id__name: nil
        } ]
      end

      [ *properties, *self.compound_type_properties(**args) ]
    end

    def self.entity_fields(**args)
      self.entity_fields_from_properties(self.entity_properties(**args))
    end

    def self.entity_columns(**args)
      self.entity_columns_from_properties(self.entity_properties(**args))
    end

    def self.find_by_name_or_synonyms(value)
      self.detailed({ filter: ActiveSupport::JSON.encode([ { property: "name", operator: "eq", value: value } ]) }).where(ActiveRecord::Base.sanitize_sql_array([ "grit_compounds_compounds.name = ?", value ]))
    end

    def self.loader_find_by(prop, value, **args)
      if prop == "name"
        self.find_by_name_or_synonyms(value).take
      else
        find_by({ prop => value })
      end
    end

    def self.loader_find_by!(prop, value, **args)
      if prop == "name"
        self.find_by_name_or_synonyms(value).take!
      else
        find_by!({ prop => value })
      end
    end

    def self.synonyms_of_filtered_compounds(params = nil)
      return nil if params.nil?
      return nil if params[:filter].nil?

      filters = ActiveSupport::JSON.decode(params[:filter])
      name_filter = filters.find { |filter| filter["property"] == "name" }
      return nil if name_filter.nil?

      query = self.unscoped
        .select("grit_compounds_compounds.id")
        .select("grit_compounds_compounds.created_by")
        .select("grit_compounds_compounds.updated_by")
        .select("grit_compounds_compounds.created_at")
        .select("grit_compounds_compounds.updated_at")
        .select("grit_compounds_compounds.number")
        .select("grit_compounds_synonyms__.name AS name")
        .select("grit_compounds_compounds.description")
        .select("grit_compounds_compounds.compound_type_id")
        .select("grit_compounds_compounds.origin_id")
        .select("grit_core_origins__.name as origin_id__name")
        .select("grit_compounds_compound_types__.name as compound_type_id__name")
        .select("grit_compounds_molecules__.molfile as molecule")
        .select("grit_compounds_molecules__.canonical_smiles as smiles")
        .select("grit_compounds_molecules__.molweight as molweight")
        .select("grit_compounds_molecules__.logp as logp")
        .select("grit_compounds_molecules__.molformula as molformula")
        .select("grit_compounds_molecules__.inchi as inchi")
        .select("grit_compounds_molecules__.inchikey as inchikey")
        .select("grit_compounds_molecules__.hba as hba")
        .select("grit_compounds_molecules__.hbd as hbd")
        .joins("LEFT OUTER JOIN grit_compounds_compound_types grit_compounds_compound_types__ ON grit_compounds_compounds.compound_type_id = grit_compounds_compound_types__.id")
        .joins("LEFT OUTER JOIN grit_core_origins grit_core_origins__ ON grit_compounds_compounds.origin_id = grit_core_origins__.id")
        .joins("LEFT OUTER JOIN grit_compounds_molecules_compounds grit_compounds_molecules_compounds__ ON grit_compounds_compounds.id = grit_compounds_molecules_compounds__.compound_id")
        .joins("LEFT OUTER JOIN grit_compounds_molecules grit_compounds_molecules__ ON grit_compounds_molecules_compounds__.molecule_id = grit_compounds_molecules__.id")
        .joins("JOIN grit_compounds_synonyms grit_compounds_synonyms__ on grit_compounds_synonyms__.compound_id = grit_compounds_compounds.id")

      filter_value = name_filter["value"]
      if name_filter["operator"] == "eq" then
          return query.where.not(ActiveRecord::Base.sanitize_sql_array([
            "EXISTS (SELECT NULL FROM grit_compounds_compounds grit_compounds_compounds__name_check WHERE grit_compounds_compounds__name_check.id = grit_compounds_synonyms__.compound_id AND grit_compounds_compounds__name_check.name = ?)",
            filter_value
          ]))
      elsif [ "like", "contains", "regexp" ].include?(name_filter["operator"]) then
          filter_value.gsub!("_", '\\_') # Take _ literal
          filter_value.gsub!("*", "%") # Use * as wildcard
          filter_value.gsub!(".", "_") # Use . as wildcard
          wildcards = %w[% _]
          if !filter_value.start_with?(*wildcards)
              filter_value = "%" + filter_value
          end
          if !filter_value.end_with?(*wildcards)
              filter_value += "%"
          end
          return query.where.not(ActiveRecord::Base.sanitize_sql_array([
            "EXISTS (SELECT NULL FROM grit_compounds_compounds grit_compounds_compounds__name_check WHERE grit_compounds_compounds__name_check.id = grit_compounds_synonyms__.compound_id AND grit_compounds_compounds__name_check.name ILIKE ?)",
            filter_value
          ]))

      elsif name_filter["operator"] == "in" or name_filter["operator"] == "not in" # In a list
          operator = name_filter["operator"]
          if name_filter["filter_value"].kind_of?(Array) then
              filter_value = filter_value
          else
              filter_value = filter_value.split(",")
          end
          return query.where.not(ActiveRecord::Base.sanitize_sql_array([
            "EXISTS (SELECT NULL FROM grit_compounds_compounds grit_compounds_compounds__name_check WHERE grit_compounds_compounds__name_check.id = grit_compounds_synonyms__.compound_id AND grit_compounds_compounds__name_check.name #{operator} (?))",
             filter_value
          ]))
      end
      nil
    end

    def self.detailed(params = nil)
      synonyms_query = self.synonyms_of_filtered_compounds(params)
      query = self.unscoped
      .select("grit_compounds_compounds.id")
      .select("grit_compounds_compounds.created_by")
      .select("grit_compounds_compounds.updated_by")
      .select("grit_compounds_compounds.created_at")
      .select("grit_compounds_compounds.updated_at")
      .select("grit_compounds_compounds.number")
      .select("grit_compounds_compounds.name")
      .select("grit_compounds_compounds.description")
      .select("grit_compounds_compounds.compound_type_id")
      .select("grit_compounds_compounds.origin_id")
      .select("grit_core_origins__.name as origin_id__name")
      .select("grit_compounds_compound_types__.name as compound_type_id__name")
      .select("grit_compounds_molecules__.molfile as molecule")
      .select("grit_compounds_molecules__.canonical_smiles as smiles")
      .select("grit_compounds_molecules__.molweight as molweight")
      .select("grit_compounds_molecules__.logp as logp")
      .select("grit_compounds_molecules__.molformula as molformula")
      .select("grit_compounds_molecules__.inchi as inchi")
      .select("grit_compounds_molecules__.inchikey as inchikey")
      .select("grit_compounds_molecules__.hba as hba")
      .select("grit_compounds_molecules__.hbd as hbd")
      .joins("LEFT OUTER JOIN grit_compounds_compound_types grit_compounds_compound_types__ ON grit_compounds_compounds.compound_type_id = grit_compounds_compound_types__.id")
      .joins("LEFT OUTER JOIN grit_core_origins grit_core_origins__ ON grit_compounds_compounds.origin_id = grit_core_origins__.id")
      .joins("LEFT OUTER JOIN grit_compounds_molecules_compounds grit_compounds_molecules_compounds__ ON grit_compounds_compounds.id = grit_compounds_molecules_compounds__.compound_id")
      .joins("LEFT OUTER JOIN grit_compounds_molecules grit_compounds_molecules__ ON grit_compounds_molecules_compounds__.molecule_id = grit_compounds_molecules__.id")
      query = query.from("(\n#{[ query.to_sql, synonyms_query.to_sql ].join("\nUNION ALL\n")}\n) grit_compounds_compounds") unless synonyms_query.nil?

      CompoundProperty.all.each do |property|
        query = query
          .joins("LEFT OUTER JOIN grit_compounds_compound_property_values cpv__#{property.safe_name} on cpv__#{property.safe_name}.compound_property_id = #{property.id} and cpv__#{property.safe_name}.compound_id = grit_compounds_compounds.id")

        if property.data_type.is_entity
          entity_klass = property.data_type.model
          query = query
            .joins("LEFT OUTER JOIN #{property.data_type.table_name} cpv__#{property.safe_name}__entities on cpv__#{property.safe_name}__entities.id = cpv__#{property.safe_name}.entity_id_value")
            .select("cpv__#{property.safe_name}.entity_id_value as #{property.safe_name}")
            entity_klass.display_properties&.each do |display_property|
              query = query
              .select("cpv__#{property.safe_name}__entities.#{display_property[:name]} as #{property.safe_name}__#{display_property[:name]}")
            end
        else
          query = query.select("cpv__#{property.safe_name}.#{property.data_type.name}_value as #{property.safe_name}")
        end
      end
      query
    end

    def set_number
      self.number = ActiveRecord::Base.connection.execute("SELECT concat('GRIT', LPAD((nextval('public.grit_compounds_compound_seq'::regclass))::text, 7, '0')) as number").first["number"]
    end

  def self.cv(params = nil)
    raise "compound_id parameter is required" if params.nil? || params[:compound_id].nil?
    compound_id = params[:compound_id]
     query = Grit::Assays::ExperimentDataSheetValue.unscoped
      .select("grit_assays_experiment_data_sheet_values.id")
      .select("grit_assays_experiment_data_sheet_values.entity_id_value")
      .select("target_values.id")
      .select("target_values.decimal_value")
      .select("target_values.assay_data_sheet_column_id")
      .select("target_values.experiment_data_sheet_record_id")
      .select("target_data_sheet_columns.name as assay_data_sheet_column_id__name")
      .select("data_sheet_definitions.id as assay_data_sheet_definition_id")
      .select("data_sheet_definitions.name as assay_data_sheet_definition_id__name")
      .select("data_sheets.id as experiment_data_sheet_id")
      .select("experiments.id as experiment_id")
      .select("experiments.name as experiment_id__name")
      .select("assays.id as assay_id")
      .select("assays.name as assay_id__name")
      .joins("join grit_assays_experiment_data_sheet_values target_values on target_values.experiment_data_sheet_record_id = grit_assays_experiment_data_sheet_values.experiment_data_sheet_record_id")
      .joins("join grit_assays_assay_data_sheet_columns target_data_sheet_columns on target_values.assay_data_sheet_column_id = target_data_sheet_columns.id")
      .joins("join grit_core_data_types data_types on data_types.id = target_data_sheet_columns.data_type_id")
      .joins("join grit_assays_assay_data_sheet_definitions data_sheet_definitions on target_data_sheet_columns.assay_data_sheet_definition_id = data_sheet_definitions.id")
      .joins("join grit_assays_experiment_data_sheet_records as data_sheet_records on grit_assays_experiment_data_sheet_values.experiment_data_sheet_record_id = data_sheet_records.id")
      .joins("join grit_assays_experiment_data_sheets as data_sheets on data_sheets.id = data_sheet_records.experiment_data_sheet_id")
      .joins("join grit_assays_experiments as experiments on experiments.id = data_sheets.experiment_id")
      .joins("join grit_assays_assays as assays on assays.id = experiments.assay_id")
      .joins("join grit_core_publication_statuses as publication_statuses on publication_statuses.id = experiments.publication_status_id")
      .where("grit_assays_experiment_data_sheet_values.entity_id_value = ?", compound_id)
      .where("data_types.name in ('decimal', 'integer')")
      .where("data_sheet_definitions.result = true")
      .where("publication_statuses.name = 'Published'")
    end
  end
end
