class CreateGritAssaysExperiments < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_assays_experiments, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false, index: true
      t.text :description
      t.json :plots, default: {}

      t.references :assay, null: false, foreign_key: { name: "assays_experiments_assays_assay_id_fkey", to_table: "grit_assays_assays" }
      t.index [ :name, :assay_id ], unique: true, name: "uniq_experiment_name_per_assay"
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_experiments BEFORE INSERT OR UPDATE ON public.grit_assays_experiments FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_experiments

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_experiments ON public.grit_assays_experiments;"
  end
end
