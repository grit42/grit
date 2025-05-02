
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
