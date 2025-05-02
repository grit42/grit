class CreateGritCoreCountries < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_core_countries, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false
      t.string :iso, null: false
    end

    execute "CREATE TRIGGER manage_stamps_grit_core_countries BEFORE INSERT OR UPDATE ON public.grit_core_countries FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_core_countries

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_core_countries ON public.grit_core_countries;"
  end
end
