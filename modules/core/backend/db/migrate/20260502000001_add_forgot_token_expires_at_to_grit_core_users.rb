class AddForgotTokenExpiresAtToGritCoreUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_core_users, :forgot_token_expires_at, :datetime, if_not_exists: true
  end
end
