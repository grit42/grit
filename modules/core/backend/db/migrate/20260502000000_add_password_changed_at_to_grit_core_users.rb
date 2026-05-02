class AddPasswordChangedAtToGritCoreUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_core_users, :password_changed_at, :datetime
  end
end
