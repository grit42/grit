class CreateGritCompoundsCompoundPropertyValues < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_compounds_compound_property_values, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.string :numeric_sign, null: true, default: nil
      t.string :string_value, null: true, default: nil
      t.bigint :integer_value, null: true, default: nil
      t.decimal :decimal_value, null: true, default: nil
      t.float :float_value, null: true, default: nil
      t.text :text_value, null: true, default: nil
      t.datetime :datetime_value, null: true, default: nil
      t.date :date_value, null: true, default: nil
      t.boolean :boolean_value, null: true, default: nil
      t.bigint :entity_id_value, null: true, default: nil

      t.references :compound_property, null: false, foreign_key: { name: "grit_compounds_property_value_compound_property_id_fkey", to_table: :grit_compounds_compound_properties, deferrable: :deferred }, index: true
      t.references :compound, null: false, foreign_key: { name: "grit_compounds_property_value_compound_id_fkey", to_table: :grit_compounds_compounds, deferrable: :deferred }, index: true

      t.index [ :compound_property_id, :compound_id ], unique: true, name: "uniq_compound_property_value_per_compound"
    end

    execute "CREATE TRIGGER manage_stamps_grit_compounds_compound_property_values BEFORE INSERT OR UPDATE ON public.grit_compounds_compound_property_values FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_compounds_compound_property_values

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_compounds_compound_property_values ON public.grit_compounds_compound_property_values;"
  end
end
