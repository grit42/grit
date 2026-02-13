class CreateGritCoreDataTypes < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_core_data_types, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false, index: { unique: true }
      t.boolean :is_entity, default: false
      t.string :table_name
      t.text :description
      t.jsonb :meta, default: {}
    end

    execute "CREATE TRIGGER manage_stamps_grit_core_data_types BEFORE INSERT OR UPDATE ON public.grit_core_data_types FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_core_data_types

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_core_data_types ON public.grit_core_data_types;"
  end
end
