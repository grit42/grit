Grit::Core::Role.upsert({ name: "AssayAdministrator", description: "Can create and modify assay models and assays" }) if Grit::Core::Role.find_by(name: "AssayAdministrator").nil?
Grit::Core::Role.upsert({ name: "AssayUser", description: "Can create and modify experiments" }) if Grit::Core::Role.find_by(name: "AssayUser").nil?
