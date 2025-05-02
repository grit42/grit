class CreateGritCoreUsers < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_core_users, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at

      t.string    :name

      # Authlogic::ActsAsAuthentic::Email
      t.string    :email
      t.index     :email, unique: true

      # Authlogic::ActsAsAuthentic::Login
      t.string    :login
      t.index :login, unique: true

      # Authlogic::ActsAsAuthentic::Password
      t.string    :crypted_password
      t.string    :password_salt

      # Authlogic::ActsAsAuthentic::PersistenceToken
      t.string    :persistence_token
      t.index     :persistence_token, unique: true

      # Authlogic::ActsAsAuthentic::SingleAccessToken
      t.string    :single_access_token
      t.index     :single_access_token, unique: true

      # Authlogic::ActsAsAuthentic::PerishableToken
      t.string    :perishable_token
      t.index     :perishable_token, unique: true

      # See "Magic Columns" in Authlogic::Session::Base
      t.integer   :login_count, default: 0, null: false
      t.integer   :failed_login_count, default: 0, null: false
      t.datetime  :last_request_at
      t.datetime  :current_login_at
      t.datetime  :last_login_at
      t.string    :current_login_ip
      t.string    :last_login_ip

      # See "Magic States" in Authlogic::Session::Base
      t.boolean   :active, default: false

      t.string :activation_token
      t.string :forgot_token
      t.boolean :two_factor
      t.string :two_factor_token
      t.datetime :two_factor_expiry
      t.jsonb :settings, default: {}

      t.references :origin, null: false, foreign_key: { name: "core_users_core_origin_id_fkey", to_table: "grit_core_origins" }
      t.references :location, foreign_key: { name: "core_users_core_location_id_fkey", to_table: "grit_core_locations" }
    end

    execute "CREATE TRIGGER manage_stamps_grit_core_users BEFORE INSERT OR UPDATE ON public.grit_core_users FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_core_users

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_core_users ON public.grit_core_users;"
  end
end
