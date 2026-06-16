class CreateGritAssaysAnalysisExperiments < ActiveRecord::Migration[8.1]
  def up
    create_table :grit_assays_analysis_experiments, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.references :analysis, null: false, foreign_key: { name: "analysis_experiments_analysis", to_table: "grit_assays_analyses" }
      t.references :experiment, null: false, foreign_key: { name: "analysis_experiments_experiment", to_table: "grit_assays_experiments" }
      t.index [ :analysis_id, :experiment_id ], unique: true, name: "uniq_experiment_per_vocabulary"
    end

    execute "CREATE TRIGGER manage_stamps_grit_assays_analysis_experiments BEFORE INSERT OR UPDATE ON public.grit_assays_analysis_experiments FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_assays_analysis_experiments

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_assays_analysis_experiments ON public.grit_assays_analysis_experiments;"
  end
end
