class CreateGritCoreLoadSetBlocks < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_core_load_set_blocks, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.string :name, null: false
      t.json :mappings, default: {}
      t.string :separator, null: false

      t.references :load_set, foreign_key: { name: "core_load_set_blocks_core_load_set_id_fkey", to_table: "grit_core_load_sets" }, null: false
      t.references :status, foreign_key: { name: "core_load_set_blocks_core_load_set_status_id_fkey", to_table: "grit_core_load_set_statuses" }, null: false
    end

    execute "CREATE TRIGGER manage_stamps_grit_core_load_set_blocks BEFORE INSERT OR UPDATE ON public.grit_core_load_set_blocks FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_core_load_set_blocks

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_core_load_set_blocks ON public.grit_core_load_set_blocks;"
  end
end
