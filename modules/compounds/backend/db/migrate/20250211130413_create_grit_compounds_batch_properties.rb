class CreateGritCompoundsBatchProperties < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_compounds_batch_properties, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.string :name, null: false
      t.string :safe_name, null: false
      t.text :description
      t.integer :sort
      t.boolean :required, null: false, default: false

      t.references :compound_type, null: true, foreign_key: { name: "compounds_batch_properties_compounds_compound_types_fkey", to_table: "grit_compounds_compound_types" }
      t.references :data_type, null: false, foreign_key: { name: "compounds_batch_properties_core_data_types_fkey", to_table: "grit_core_data_types" }
      t.references :unit, null: true, foreign_key: { name: "compounds_batch_properties_core_units_fkey", to_table: "grit_core_units" }, index: false
    end

    execute "CREATE TRIGGER manage_stamps_grit_compounds_batch_properties BEFORE INSERT OR UPDATE ON public.grit_compounds_batch_properties FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_compounds_batch_properties

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_compounds_batch_properties ON public.grit_compounds_batch_properties;"
  end
end
