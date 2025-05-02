Grit::Compounds::CompoundType.insert({ name: 'Small molecule', description: 'Small molecules', has_structure: true }) if Grit::Compounds::CompoundType.find_by(name: "Small molecule").nil?

Grit::Core::DataType.upsert({ name: "Grit::Compounds::Compound", description: "Compound", is_entity: true, table_name: "grit_compounds_compounds" }, unique_by: :name)
Grit::Core::DataType.upsert({ name: "Grit::Compounds::Batch", description: "Batch", is_entity: true, table_name: "grit_compounds_batches" }, unique_by: :name)

Grit::Core::Role.upsert({ name: "CompoundAdministrator", description: "Can create and modify compound types and properties" }) if Grit::Core::Role.find_by(name: "CompoundAdministrator").nil?
Grit::Core::Role.upsert({ name: "CompoundUser", description: "Can create and modify compounds and bacthes" }) if Grit::Core::Role.find_by(name: "CompoundUser").nil?
