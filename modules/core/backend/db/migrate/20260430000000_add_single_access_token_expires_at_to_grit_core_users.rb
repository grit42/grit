class AddSingleAccessTokenExpiresAtToGritCoreUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :grit_core_users, :single_access_token_expires_at, :datetime
  end
end
