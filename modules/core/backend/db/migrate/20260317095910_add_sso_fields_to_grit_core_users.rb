class AddSsoFieldsToGritCoreUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :grit_core_users, :auth_method, :string, default: "local", null: false
    add_column :grit_core_users, :sso_uid, :string

    add_index :grit_core_users, [ :auth_method, :sso_uid ], unique: true, where: "sso_uid IS NOT NULL",
              name: "index_grit_core_users_on_auth_method_and_sso_uid"
  end
end
