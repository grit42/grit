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
  class CompoundsController < ApplicationController
    include Grit::Core::GritEntityController

    def create
      ActiveRecord::Base.transaction do
        permitted_params = params.permit(self.permitted_params)
        @record = Grit::Compounds::Compound.new(permitted_params)

        if !@record.save
          render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
          return
        end

        unless params[:molecule].nil?
          molecule_id = Grit::Compounds::Molecule.by_molfile(params[:molecule])&.id
          if molecule_id.nil?
            molecule_record = Grit::Compounds::Molecule.new({
              molfile: params[:molecule]
            })
            if !molecule_record.save
              render json: { success: false, errors: molecule_record.errors }, status: :unprocessable_entity
              return
            end
            molecule_id = molecule_record.id
          end
          molecule_compound_record = Grit::Compounds::MoleculesCompound.new({
            molecule_id: molecule_id,
            compound_id: @record.id
          })
          if !molecule_compound_record.save
            render json: { success: false, errors: molecule_compound_record.errors }, status: :unprocessable_entity
            return
          end
        end

        Grit::Compounds::CompoundProperty.where(compound_type_id: [ @record.compound_type_id, nil ]).each do |prop|
          if !params[prop.safe_name].nil? && !params[prop.safe_name].blank?
            prop_value = Grit::Compounds::CompoundPropertyValue.new(
              compound_id: @record.id,
              compound_property_id: prop.id,
            )
            if prop.data_type.is_entity
              prop_value.entity_id_value = params[prop.safe_name]
            else
              prop_value["#{prop.data_type.name}_value"] = params[prop.safe_name]
            end
            prop_value.save!
          end
        end

        scope = get_scope(params[:scope] || "detailed", params)
        @record = scope.find(@record.id)
        render json: { success: true, data: @record }, status: :created, location: @record
      end
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def update
      @record = Grit::Compounds::Compound.find(params[:id])
      permitted_params = params.permit(self.permitted_params)

      if !@record.update(permitted_params)
        render json: { success: false, errors: @record.errors }, status: :unprocessable_entity
        return
      end

      Grit::Compounds::CompoundProperty.where(compound_type_id: [ @record.compound_type_id, nil ]).each do |prop|
        prop_value = Grit::Compounds::CompoundPropertyValue.find_by(compound_id: @record.id, compound_property_id: prop.id)
        if prop_value && (!params[prop.safe_name].nil? && !params[prop.safe_name].blank?)
          if prop.data_type.is_entity
            prop_value.entity_id_value = params[prop.safe_name]
          else
            prop_value["#{prop.data_type.name}_value"] = params[prop.safe_name]
          end
          prop_value.save!
        elsif !prop_value && (!params[prop.safe_name].nil? && !params[prop.safe_name].blank?)
          prop_value = Grit::Compounds::CompoundPropertyValue.new(
            compound_id: @record.id,
            compound_property_id: prop.id,
          )
          if prop.data_type.is_entity
            prop_value.entity_id_value = params[prop.safe_name]
          else
            prop_value["#{prop.data_type.name}_value"] = params[prop.safe_name]
          end
          prop_value.save!
        elsif prop_value && (params[prop.safe_name].nil? || params[prop.safe_name].blank?)
          prop_value.destroy
        end
      end
      scope = get_scope(params[:scope] || "detailed", params)
      @record = scope.find(params[:id])
      render json: { success: true, data: @record }
    rescue StandardError => e
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end

    def export
      query = index_entity_for_export(params)

      if params[:columns]&.length
        klass = controller_path.classify.constantize
        query = klass.unscoped.select(*params[:columns].map { |c| c == "molecule" ? "smiles" : c }).from(query, :sub)
      end

      return if query.nil?

      file = csv_from_query(query)

      send_data file.read, filename: "#{controller_path.classify.demodulize.underscore}.csv", type: :csv
    end

    private

    def permitted_params
      [ "name", "description", "origin_id", "compound_type_id" ]
    end
  end
end
