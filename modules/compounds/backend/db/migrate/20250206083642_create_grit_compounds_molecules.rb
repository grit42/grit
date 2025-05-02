class CreateGritCompoundsMolecules < ActiveRecord::Migration[7.2]
  def up
    execute <<-SQL
      CREATE EXTENSION IF NOT EXISTS rdkit WITH SCHEMA public;
      COMMENT ON EXTENSION rdkit IS 'Cheminformatics functionality for PostgreSQL.';
    SQL

    create_table :grit_compounds_molecules, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.bigint :molid, null: false
      t.text :molfile, null: false
      t.numeric :molweight
      t.text :molformula
      t.text :svg
      t.column :rdkit_mol, "public.mol"
      t.text :inchi
      t.text :inchikey
      t.numeric :logp
      t.numeric :hba
      t.numeric :hbd
      t.text :canonical_smiles

      t.index :rdkit_mol, name: "grit_compounds_molecules_rdkit_mol_index", using: "gist"
    end

    execute <<-SQL
      CREATE FUNCTION public.update_rdkit_mol_column() RETURNS trigger
        LANGUAGE plpgsql
        AS $$
      BEGIN
        --IF is_valid_ctab(NEW.molfile::cstring)
        NEW.rdkit_mol        = mol_from_ctab(NEW.molfile::cstring);
        NEW.molweight        = mol_amw(NEW.rdkit_mol);
        NEW.inchi            = mol_inchi(NEW.rdkit_mol);
        NEW.inchikey         = mol_inchikey(NEW.rdkit_mol);
        NEW.molformula       = mol_formula(NEW.rdkit_mol);
        NEW.logp             = mol_logp(NEW.rdkit_mol);
        NEW.hba              = mol_hba(NEW.rdkit_mol);
        NEW.hbd              = mol_hbd(NEW.rdkit_mol);
        NEW.canonical_smiles = mol_to_smiles(NEW.rdkit_mol);
	      RETURN NEW;
      END
      $$;

      CREATE TRIGGER update_rdkit_mol_column BEFORE INSERT OR UPDATE ON public.grit_compounds_molecules FOR EACH ROW EXECUTE FUNCTION public.update_rdkit_mol_column();
    SQL

    execute "CREATE TRIGGER manage_stamps_grit_compounds_molecules BEFORE INSERT OR UPDATE ON public.grit_compounds_molecules FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_compounds_molecules

    execute "DROP EXTENSION IF EXISTS rdkit;"
    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_compounds_molecules ON public.grit_compounds_molecules;"
    execute "DROP TRIGGER IF EXISTS update_rdkit_mol_column ON public.grit_compounds_molecules;"
    execute "DROP FUNCTION IF EXISTS update_rdkit_mol_column;"
  end
end
