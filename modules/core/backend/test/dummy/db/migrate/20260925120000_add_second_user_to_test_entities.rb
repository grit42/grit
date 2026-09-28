class AddSecondUserToTestEntities < ActiveRecord::Migration[7.2]
  def change
    add_reference :test_entities, :second_user, foreign_key: { name: "test_second", to_table: "grit_core_users" }
  end
end
