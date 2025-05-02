class CreateGritCoreUserRoles < ActiveRecord::Migration[7.2]
  def up
    create_table :grit_core_user_roles, id: false do |t|
      t.bigint :id, primary_key: true, default: -> { 'nextval(\'grit_seq\'::regclass)' }
      t.string :created_by, limit: 30, null: false, default: "SYSTEM"
      t.datetime :created_at, null: false, default: -> { 'CURRENT_TIMESTAMP' }
      t.string :updated_by, limit: 30
      t.datetime :updated_at
      t.references :user, null: false, foreign_key: { name: "core_user_roles_core_user_id_fkey", to_table: "grit_core_users" }, index: true
      t.references :role, null: false, foreign_key: { name: "core_user_roles_core_role_id_fkey", to_table: "grit_core_roles" }, index: true
    end

    execute "CREATE TRIGGER manage_stamps_grit_core_user_roles BEFORE INSERT OR UPDATE ON public.grit_core_user_roles FOR EACH ROW EXECUTE FUNCTION public.manage_stamps();"
  end

  def down
    drop_table :grit_core_user_roles

    execute "DROP TRIGGER IF EXISTS manage_stamps_grit_core_user_roles ON public.grit_core_user_roles;"
  end
end
