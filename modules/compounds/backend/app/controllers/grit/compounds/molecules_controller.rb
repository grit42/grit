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
  class MoleculesController < ApplicationController
    include Grit::Core::GritEntityController

    def molecule_exists
      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute("SET LOCAL rdkit.do_chiral_sss=true;")
        existing_molecule = Molecule.by_molfile(params[:molfile])
        existing_molecule_compounds = existing_molecule.nil? ? [] : Compound.detailed().where("grit_compounds_molecules__.id = #{existing_molecule.id}").all

        render json: { success: true, data: { molfile: params[:molfile], existing_molecule_id: existing_molecule&.id, existing_molecule_compounds: existing_molecule_compounds } }
      end
    rescue StandardError => e
      logger.warn e.to_s
      render json: { success: false, errors: e.to_s }, status: :internal_server_error
    end


    private

    def permitted_params
      [ "name", "compound_id" ]
    end
  end
end
