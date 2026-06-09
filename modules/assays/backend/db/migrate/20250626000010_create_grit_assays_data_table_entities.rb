class CreateGritAssaysDataTableEntities < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_data_table_entities, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.references :data_table, null: false, foreign_key: { name: "assays_data_table_entities_assays_data_table_id_fkey", to_table: "grit_assays_data_tables" }
      t.bigint :entity_id, null: false
      t.integer :sort
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_data_table_entities BEFORE INSERT OR UPDATE ON public.grit_assays_data_table_entities FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_data_table_entities

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_data_table_entities ON public.grit_assays_data_table_entities;"
  end
end
