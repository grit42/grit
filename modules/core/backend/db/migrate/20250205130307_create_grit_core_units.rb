class CreateGritCoreUnits < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_core_units, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false, index: { unique: true, name: 'idx_units_on_name_unique' }
      t.string :abbreviation, null: false, index: { unique: true, name: 'idx_units_on_abbreviation_unique' }
      t.string :unit_type
      t.string :si_unit
    end

    execute "CREATE TRIGGER manage_stamps_grit_core_units BEFORE INSERT OR UPDATE ON public.grit_core_units FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_core_units

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_core_units ON public.grit_core_units;"
  end
end
