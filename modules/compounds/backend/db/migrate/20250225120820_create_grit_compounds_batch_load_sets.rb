class CreateGritCompoundsBatchLoadSets < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_compounds_batch_load_sets, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.references :load_set, foreign_key: { name: "compounds_batch_load_sets_core_load_set_id_fkey", to_table: "grit_core_load_sets" }, null: false
      t.references :compound_type, foreign_key: { name: "compounds_batch_load_sets_compounds_compound_types_fkey", to_table: "grit_compounds_compound_types" }, null: false
    end

    execute "CREATE TRIGGER manage_stamps_grit_compounds_batch_load_sets BEFORE INSERT OR UPDATE ON public.grit_compounds_batch_load_sets FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_compounds_batch_load_sets

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_compounds_batch_load_sets ON public.grit_compounds_batch_load_sets;"
  end
end
