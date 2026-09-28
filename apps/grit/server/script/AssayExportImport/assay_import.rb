# Standalone script — thin CLI wrapper around Grit::Assays::AssayModelDump (the same service
# the "Export"/"Import" buttons on the Assay Model admin screens call). Imports Assay Model
# definitions, vocabularies and experiment metadata templates previously dumped by
# script/assay_export.rb. Ids are never reused — the target database assigns fresh ones. Entries
# that already exist in the target database (matched by name), or that reference a missing unit or
# data type, are skipped and reported.
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

preview = Grit::Assays::AssayModelDump.preview(dump)
preview.each do |section, entries|
  entries.each do |entry|
    puts "Skipping #{section} '#{entry['name']}': already exists" if entry["installed"]
    puts "Skipping #{section} '#{entry['name']}': #{entry['problems'].join('; ')}" if !entry["installed"] && entry["problems"].any?
  end
end

selection = Grit::Assays::AssayModelDump.importable_selection(dump)
if selection.values.all?(&:empty?)
  puts "Nothing to import"
  exit
end

imported = Grit::Assays::AssayModelDump.import(dump, selection)

imported.each do |section, records|
  puts "Imported #{records.size} #{section}:"
  records.each { |record| puts "  ##{record.id} #{record.name}" }
end
