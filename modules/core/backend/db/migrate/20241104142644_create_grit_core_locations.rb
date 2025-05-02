class CreateGritCoreLocations < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_core_locations, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false
      t.text :print_address
      t.references :country, null: false, foreign_key: { name: "core_locations_core_country_id_fkey", to_table: "grit_core_countries" }
      t.references :origin, null: false, foreign_key: { name: "core_locations_core_origin_id_fkey", to_table: "grit_core_origins" }
    end

    execute "CREATE TRIGGER manage_stamps_grit_core_locations BEFORE INSERT OR UPDATE ON public.grit_core_locations FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_core_locations

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_core_locations ON public.grit_core_locations;"
  end
end
