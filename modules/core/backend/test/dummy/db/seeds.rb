# This file ensures the existence of records required to run the application in every environment (production,
# development, test). The code here should be idempotent so that it can be executed at any point in every environment.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

Grit::Core::Engine.load_seed

read_role_id = Grit::Core::Role.find_by(name: "Read").id
analyse_role_id = Grit::Core::Role.find_by(name: "Analyse").id
write_role_id = Grit::Core::Role.find_by(name: "Write").id
manage_role_id = Grit::Core::Role.find_by(name: "Manage").id
admin_role_id = Grit::Core::Role.find_by(name: "Administrator").id

def insert_user(login, role_id)
  unless Grit::Core::User.find_by(login: login).present?
    salt = Authlogic::Random.hex_token
    id = Grit::Core::User.insert({
      origin_id: 1,
      login: login,
      name: "#{login.capitalize} User",
      active: true,
      email: "#{login}@example.com",
      password_salt: salt,
      crypted_password: Grit::Core::User.crypto_provider.encrypt("password" + salt),
      persistence_token: Authlogic::Random.hex_token,
      single_access_token: Authlogic::Random.friendly_token
    })[0]["id"]
    Grit::Core::UserRole.insert({ user_id: id, role_id: role_id })
  end
end

insert_user("read", read_role_id)
insert_user("analyse", analyse_role_id)
insert_user("write", write_role_id)
insert_user("manage", manage_role_id)
insert_user("devadmin", admin_role_id)
