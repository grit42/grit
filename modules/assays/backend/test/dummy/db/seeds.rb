
def load_engine_seed(engine, seeded)
  unless seeded.include? engine
    puts "Seeding #{engine.name}"
    engine.load_seed
    seeded = [ *seeded, engine ]
  end
  seeded
end

def seed_engine_prerequisites(engine, seeded)
  engine.seeds[:prerequisites]&.each do |e|
    unless seeded.include? e
      seeded = [ *seed(e, seeded) ]
    end
  end
  seeded
end

def seed(engine, seeded)
  seeded = seed_engine_prerequisites(engine, seeded)
  seeded = load_engine_seed(engine, seeded)
end

seeded = []
Rails::Engine.descendants.each do |engine|
  if engine.respond_to?(:seeds) && engine.seeds[:auto_seed]
    seeded = seed(engine, seeded)
  end
end

read_role_id = Grit::Core::Role.find_by(name: "Read").id
analyse_role_id = Grit::Core::Role.find_by(name: "Analyse").id
write_role_id = Grit::Core::Role.find_by(name: "Write").id
manage_role_id = Grit::Core::Role.find_by(name: "Manage").id

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
