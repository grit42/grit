# Standalone script — thin CLI wrapper around Grit::Assays::AssayModelDump (the same service
# the "Export"/"Import" buttons on the Assay Model admin screens call). Imports Assay Model
# definitions previously dumped by script/assay_export.rb. Ids are never reused — the target
# database assigns fresh ones.
#
# Usage (from apps/grit/server):
#   FILE=tmp/assay_export.json bin/rails runner script/assay_import.rb

file = ENV["FILE"]
raise "Usage: FILE=path/to/dump.json bin/rails runner script/assay_import.rb" if file.blank?
raise "File not found: #{file}" unless File.exist?(file)

dump = JSON.parse(File.read(file))

# created_by/updated_by tracking (Grit::Core::GritEntityRecord#set_updater) needs a
# "current user" outside of a real authenticated request; only #login is read.
RequestStore.store["current_user"] = Struct.new(:login, :id).new("SYSTEM", nil)

imported = ActiveRecord::Base.transaction do
  dump.map { |assay_model_attrs| Grit::Assays::AssayModelDump.import_assay_model(assay_model_attrs) }
end

puts "Imported #{imported.size} assay model(s):"
imported.each { |assay_model| puts "  ##{assay_model.id} #{assay_model.name}" }
