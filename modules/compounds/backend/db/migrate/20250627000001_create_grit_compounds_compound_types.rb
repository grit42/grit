class CreateGritCompoundsCompoundTypes < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_compounds_compound_types, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false, index: { unique: true, name: 'idx_grit_compounds_compound_types_on_name_unique' }
      t.text :description
      t.boolean :has_structure, default: false
    end

    execute "CREATE TRIGGER manage_stamps_grit_compounds_compound_types BEFORE INSERT OR UPDATE ON public.grit_compounds_compound_types FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_compounds_compound_types

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_compounds_compound_types ON public.grit_compounds_compound_types;"
  end
end
