class CreateGritCompoundsBatches < ActiveRecord::Migration[7.2]
  def up
    execute <<-SQL
      CREATE SEQUENCE public.grit_compounds_batch_seq
        START WITH 1
        INCREMENT BY 1
        NO MINVALUE
        NO MAXVALUE
        CACHE 1;
    SQL

    create_table :grit_compounds_batches, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.string :name, null: false
      t.string :origin_name, null: false
      t.text :description

      t.references :compound, null: false, foreign_key: { name: "compounds_batches_compounds_compounds_fkey", to_table: "grit_compounds_compounds" }
      t.references :compound_type, null: false, foreign_key: { name: "compounds_compounds_compounds_compound_types_fkey", to_table: "grit_compounds_compound_types" }
      t.references :origin, null: false, foreign_key: { name: "compounds_compounds_core_origins_fkey", to_table: "grit_core_origins" }
    end

    execute "CREATE TRIGGER manage_stamps_grit_compounds_batches BEFORE INSERT OR UPDATE ON public.grit_compounds_batches FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_compounds_batches

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_compounds_batches ON public.grit_compounds_batches;"
    execute "DROP SEQUENCE IF EXISTS grit_compounds_batch_seq;"
  end
end
