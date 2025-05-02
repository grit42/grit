class CreateGritCompoundsMoleculesGritCompoundsCompoundsJoinTable < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_compounds_molecules_compounds, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.references :molecule, null: false, foreign_key: { name: "grit_compounds_molecules_compounds_on_molecule_id", to_table: "grit_compounds_molecules" }, index: true
      t.references :compound, null: false, foreign_key: { name: "grit_compounds_molecules_compounds_on_compound_id", to_table: "grit_compounds_compounds" }, index: true
    end

    execute "CREATE TRIGGER manage_stamps_grit_compounds_molecules_compounds BEFORE INSERT OR UPDATE ON public.grit_compounds_molecules_compounds FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_compounds_molecules_compounds
    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_compounds_molecules_compounds ON public.grit_compounds_molecules_compounds"
  end
end
