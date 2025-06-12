class AddAuthTokenToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_core_users, :auth_token, :text
  end
end
