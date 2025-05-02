class CreateTestEntities < ActiveRecord::Migration[7.2]
  def change
    create_table :test_entities, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { "nextval('grit_seq'::regclass)" }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { "CURRENT_TIMESTAMP" }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.string :name, null: false
      t.string :another_string
      t.integer :integer
      t.decimal :decimal
      t.float :float
      t.text :text
      t.datetime :datetime
      t.date :date
      t.boolean :boolean
      t.references :user, foreign_key: { name: "test", to_table: "grit_core_users" }
    end
  end
end
