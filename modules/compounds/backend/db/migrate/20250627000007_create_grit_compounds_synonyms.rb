class CreateGritCompoundsSynonyms < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_compounds_synonyms, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.string :name, null: false, index: { unique: true, name: 'idx_grit_compounds_compound_synonyms_on_name_unique' }

      t.references :compound, null: false, foreign_key: { name: "compounds_synonyms_compounds_compounds_fkey", to_table: "grit_compounds_compounds" }
    end

    execute "CREATE TRIGGER manage_stamps_grit_compounds_synonyms BEFORE INSERT OR UPDATE ON public.grit_compounds_synonyms FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_compounds_synonyms

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_compounds_synonyms ON public.grit_compounds_synonyms;"
  end
end
