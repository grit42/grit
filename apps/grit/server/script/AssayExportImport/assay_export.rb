# Standalone script — thin CLI wrapper around Grit::Assays::AssayModelDump (the same service
# the "Export"/"Import" buttons on the Assay Model admin screens call). Exports Assay Model
# definitions (type, metadata, data sheet structure, vocabularies, metadata templates) to JSON
# with no ids, so the dump can be imported into a different database via script/assay_import.rb.
#
# Usage (from apps/grit/server):
#   bin/rails runner script/assay_export.rb                            # export all assay models
#   ASSAY_MODEL_ID=123 bin/rails runner script/assay_export.rb         # export a single assay model
#   OUTPUT=tmp/my_export.json bin/rails runner script/assay_export.rb  # custom output path

scope = ENV["ASSAY_MODEL_ID"].present? ? Grit::Assays::AssayModel.where(id: ENV["ASSAY_MODEL_ID"]) : Grit::Assays::AssayModel.all
output = ENV["OUTPUT"].presence || Rails.root.join("tmp", "assay_export_#{Time.now.strftime('%Y%m%d%H%M%S')}.json").to_s

dump = scope.map { |assay_model| Grit::Assays::AssayModelDump.export_assay_model(assay_model) }
raise "No matching Assay Model found" if dump.empty?

FileUtils.mkdir_p(File.dirname(output))
File.write(output, JSON.pretty_generate(dump))

puts "Exported #{dump.size} assay model(s) to #{output}"
