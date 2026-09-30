# Standalone script — thin CLI wrapper around Grit::Assays::AssayModelDump (the same service
# the "Export"/"Import" buttons on the Assay Model admin screens call). Exports Assay Model
# definitions (type, metadata, data sheet structure, vocabularies), assay types, metadata
# definitions, vocabularies and experiment metadata templates to JSON with no ids, so the dump can be imported into a different database
# via script/assay_import.rb.
#
# Usage (from apps/grit/server):
#   bin/rails runner script/assay_export.rb                            # export everything
#   ASSAY_MODEL_ID=123 bin/rails runner script/assay_export.rb         # a single assay model and its templates
#   OUTPUT=tmp/my_export.json bin/rails runner script/assay_export.rb  # custom output path

output = ENV["OUTPUT"].presence || Rails.root.join("tmp", "assay_export_#{Time.now.strftime('%Y%m%d%H%M%S')}.json").to_s

dump = if ENV["ASSAY_MODEL_ID"].present?
  assay_model = Grit::Assays::AssayModel.find_by(id: ENV["ASSAY_MODEL_ID"]) || raise("No matching Assay Model found")
  Grit::Assays::AssayModelDump.export(
    assay_models: [ assay_model ],
    experiment_metadata_templates: Grit::Assays::AssayModelDump.related_experiment_metadata_templates(assay_model).to_a
  )
else
  Grit::Assays::AssayModelDump.export(
    assay_models: Grit::Assays::AssayModel.order(:name).to_a,
    assay_types: Grit::Assays::AssayType.order(:name).to_a,
    assay_metadata_definitions: Grit::Assays::AssayMetadataDefinition.order(:name).to_a,
    vocabularies: Grit::Core::Vocabulary.order(:name).to_a,
    experiment_metadata_templates: Grit::Assays::ExperimentMetadataTemplate.order(:name).to_a
  )
end

FileUtils.mkdir_p(File.dirname(output))
File.write(output, JSON.pretty_generate(dump))

counts = dump.except("format", "version").map { |section, entries| "#{entries.size} #{section}" }
puts "Exported #{counts.join(', ')} to #{output}"
