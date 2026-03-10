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
  class Molecule < ApplicationRecord
    def self.by_molfile(molfile)
      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute("SET LOCAL rdkit.do_chiral_sss=true;")
        return Molecule.unscoped.where(ActiveRecord::Base.sanitize_sql_array([ "grit_compounds_molecules.rdkit_mol @= mol_from_ctab(?::cstring)", molfile ])).take
      end
    end

    def self.by_smiles(smiles)
      ActiveRecord::Base.transaction do
        ActiveRecord::Base.connection.execute("SET LOCAL rdkit.do_chiral_sss=true;")
        return Molecule.unscoped.where(ActiveRecord::Base.sanitize_sql_array([ "grit_compounds_molecules.rdkit_mol @= mol_from_smiles(?::cstring)", smiles ])).take
      end
    end

    def self.molfile_from_smiles(smiles)
      ActiveRecord::Base.connection.execute(ActiveRecord::Base.sanitize_sql_array([ "SELECT mol_to_ctab(mol_from_smiles(?::cstring)) as molecule", smiles ])).first["molecule"]
    end

    before_save :set_molid
    def set_molid
      if self.molid.nil? then
        molid = (Molecule.maximum(:molid) || 0) + 1
        self.molid = molid
      end
    end
  end
end
