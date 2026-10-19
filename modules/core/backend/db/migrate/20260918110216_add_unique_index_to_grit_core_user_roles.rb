class AddUniqueIndexToGritCoreUserRoles < ActiveRecord::Migration[8.1]
  def up
    execute <<~SQL
      DELETE FROM grit_core_user_roles
      WHERE id NOT IN (
        SELECT MIN(id) FROM grit_core_user_roles GROUP BY user_id, role_id
      )
    SQL

    add_index :grit_core_user_roles, [ :user_id, :role_id ], unique: true, name: "uniq_role_per_user"
  end

  def down
    remove_index :grit_core_user_roles, name: "uniq_role_per_user"
  end
end
