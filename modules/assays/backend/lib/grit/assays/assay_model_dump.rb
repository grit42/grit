#--
# Copyright 2025 grit42 A/S. <https://grit42.com/>
#
# This file is part of grit-assays.
#
# grit-assays is free software: you can redistribute it and/or modify it
# under the terms of the GNU General Public License as published by the Free
# Software Foundation, either version 3 of the License, or  any later version.
#
# grit-assays is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
# more details.
#
# You should have received a copy of the GNU General Public License along with
# grit-assays. If not, see <https://www.gnu.org/licenses/>.
#++

module Grit::Assays
  # Exports/imports Assay Model definitions (type, metadata, data sheet structure), vocabularies
  # and experiment metadata templates as plain hashes with no ids, so a dump can be moved between
  # databases. Used by the export/import controller actions on AssayModelsController and by the
  # apps/grit/server/script/AssayExportImport/*.rb CLI scripts.
  #
  # A dump is a hash with independently selectable sections:
  #
  #   { "format" => "grit-assays-export", "version" => 2,
  #     "assay_models" => [...], "assay_types" => [...], "assay_metadata_definitions" => [...],
  #     "vocabularies" => [...], "experiment_metadata_templates" => [...] }
  #
  # Each entry is self-contained: an assay model or template embeds the vocabularies (and
  # metadata definitions) it depends on, which are created in the target database if they don't
  # exist there yet (matched/reused by name otherwise, adding any missing vocabulary items). The
  # assay types and metadata definitions sections cover the ones no assay model uses. Unit,
  # Data Type and Publication Status are matched by name/abbreviation and must already exist.
  #
  # Import never creates a duplicate: every entry is identified by its (unique) name — metadata
  # definitions also by safe name — and a selected entry that already exists in the target
  # database is rejected. Version 1 dumps (a bare
  # array of assay models with embedded templates) are still accepted, see .normalize.
  class AssayModelDump
    FORMAT = "grit-assays-export"
    VERSION = 2

    SECTIONS = {
      "assay_models" => { model: "Grit::Assays::AssayModel", label: "Assay model" },
      "assay_types" => { model: "Grit::Assays::AssayType", label: "Assay type" },
      "assay_metadata_definitions" => { model: "Grit::Assays::AssayMetadataDefinition", label: "Metadata definition" },
      "vocabularies" => { model: "Grit::Core::Vocabulary", label: "Vocabulary" },
      "experiment_metadata_templates" => { model: "Grit::Assays::ExperimentMetadataTemplate", label: "Experiment metadata template" }
    }.freeze

    def self.export(assay_models: [], assay_types: [], assay_metadata_definitions: [], vocabularies: [], experiment_metadata_templates: [])
      {
        "format" => FORMAT,
        "version" => VERSION,
        "assay_models" => assay_models.map { |assay_model| export_assay_model(assay_model) },
        "assay_types" => assay_types.map { |assay_type| export_assay_type(assay_type) },
        "assay_metadata_definitions" => assay_metadata_definitions.map { |definition| export_assay_metadata_definition(definition) },
        "vocabularies" => vocabularies.map { |vocabulary| export_vocabulary(vocabulary) },
        "experiment_metadata_templates" => experiment_metadata_templates.map { |template| export_experiment_metadata_template(template) }
      }
    end

    # Templates that assign a default value for one of this assay model's metadata definitions.
    # Such a template may also cover definitions of other assay models — templates are exported
    # and imported as a whole, not sliced per model.
    def self.related_experiment_metadata_templates(assay_model)
      Grit::Assays::ExperimentMetadataTemplate
        .joins(:experiment_metadata_template_metadata)
        .where(experiment_metadata_template_metadata: { assay_metadata_definition_id: assay_model.assay_model_metadata.select(:assay_metadata_definition_id) })
        .distinct
    end

    # Returns a version 2 dump hash, converting a version 1 dump (bare array of assay models,
    # each embedding its templates) and dropping entries whose name appears twice in a section.
    def self.normalize(dump)
      if dump.is_a?(Array)
        dump = {
          "assay_models" => dump.map { |attrs| attrs.except("experiment_metadata_templates") },
          "vocabularies" => [],
          "experiment_metadata_templates" => dump.flat_map { |attrs| Array(attrs["experiment_metadata_templates"]) }
        }
      end
      raise "File is not a Grit assays export" unless dump.is_a?(Hash) && SECTIONS.keys.any? { |section| dump.key?(section) }

      SECTIONS.keys.to_h do |section|
        entries = Array(dump[section])
        raise "Invalid entry in '#{section}'" unless entries.all? { |attrs| attrs.is_a?(Hash) && attrs["name"].present? }
        [ section, entries.uniq { |attrs| attrs["name"] } ]
      end
    end

    # Describes what importing each entry of the dump would do, without writing anything:
    # whether it is already installed (and so can't be imported), which of its dependencies
    # would be created or reused, and problems that would make its import fail.
    def self.preview(dump)
      dump = normalize(dump)
      {
        "assay_models" => dump["assay_models"].map { |attrs| preview_assay_model(attrs) },
        "assay_types" => dump["assay_types"].map { |attrs| preview_entry("assay_types", attrs) },
        "assay_metadata_definitions" => dump["assay_metadata_definitions"].map { |attrs| preview_assay_metadata_definition(attrs) },
        "vocabularies" => dump["vocabularies"].map { |attrs| preview_vocabulary(attrs) },
        "experiment_metadata_templates" => dump["experiment_metadata_templates"].map { |attrs| preview_experiment_metadata_template(attrs) }
      }
    end

    # Names of every entry that can be imported (not installed, no problems), in the shape
    # .import expects as its selection.
    def self.importable_selection(dump)
      preview(dump).transform_values do |entries|
        entries.reject { |entry| entry["installed"] || entry["problems"].any? }.map { |entry| entry["name"] }
      end
    end

    # Imports the entries named in selection ({ section => [names] }) inside a single transaction.
    # Raises if a selected name is not in the dump or already exists in the target database.
    def self.import(dump, selection)
      dump = normalize(dump)
      selected = SECTIONS.keys.to_h do |section|
        [ section, Array(selection[section]).uniq.map { |name| selected_entry!(dump, section, name) } ]
      end
      raise "Nothing selected for import" if selected.values.all?(&:empty?)

      # Dependencies first, so assay models and templates reuse what this import just created.
      ActiveRecord::Base.transaction do
        vocabularies = selected["vocabularies"].map { |attrs| import_vocabulary!(attrs) }
        assay_types = selected["assay_types"].map { |attrs| import_assay_type(attrs) }
        definitions = selected["assay_metadata_definitions"].map { |attrs| import_or_find_assay_metadata_definition(attrs) }
        assay_models = selected["assay_models"].map { |attrs| import_assay_model(attrs) }
        templates = selected["experiment_metadata_templates"].map { |attrs| import_experiment_metadata_template(attrs) }
        {
          "assay_models" => assay_models,
          "assay_types" => assay_types,
          "assay_metadata_definitions" => definitions,
          "vocabularies" => vocabularies,
          "experiment_metadata_templates" => templates
        }
      end
    end

    def self.export_assay_model(assay_model)
      {
        "name" => assay_model.name,
        "description" => assay_model.description,
        "assay_type" => export_assay_type(assay_model.assay_type),
        "publication_status" => assay_model.publication_status.name,
        "assay_model_metadata" => assay_model.assay_model_metadata.map { |metadatum| export_assay_model_metadatum(metadatum) },
        "assay_data_sheet_definitions" => assay_model.assay_data_sheet_definitions.map { |definition| export_assay_data_sheet_definition(definition) }
      }
    end

    def self.import_assay_model(attrs)
      assay_type = Grit::Assays::AssayType.find_or_create_by!(name: attrs.fetch("assay_type").fetch("name")) do |record|
        record.description = attrs["assay_type"]["description"]
      end

      assay_model = begin
        Grit::Assays::AssayModel.create!(
          name: attrs.fetch("name"),
          description: attrs["description"],
          assay_type: assay_type,
          publication_status: find_publication_status!("Draft")
        )
      rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordInvalid => e
        raise "Assay Model '#{attrs['name']}' could not be imported (it may already exist in the target database): #{e.message}"
      end

      Array(attrs["assay_model_metadata"]).each { |metadatum_attrs| import_assay_model_metadatum(assay_model, metadatum_attrs) }
      Array(attrs["assay_data_sheet_definitions"]).each { |definition_attrs| import_assay_data_sheet_definition(assay_model, definition_attrs) }
      # Version 1 dumps embed templates in the assay model; .normalize lifts them out, but keep
      # accepting them here for callers passing a raw version 1 entry.
      Array(attrs["experiment_metadata_templates"]).each { |template_attrs| import_experiment_metadata_template(template_attrs) }

      if attrs["publication_status"] == "Published"
        assay_model.update!(publication_status: find_publication_status!("Published"))
        assay_model.create_tables
      end

      assay_model
    end

    def self.export_assay_type(assay_type)
      { "name" => assay_type.name, "description" => assay_type.description }
    end

    def self.export_vocabulary_item(item)
      { "name" => item.name, "description" => item.description }
    end

    def self.export_vocabulary(vocabulary)
      {
        "name" => vocabulary.name,
        "description" => vocabulary.description,
        "vocabulary_items" => vocabulary.vocabulary_items.map { |item| export_vocabulary_item(item) }
      }
    end

    # A data type is vocabulary-backed when it's the auto-maintained entity DataType a Vocabulary
    # creates for itself (Grit::Core::Vocabulary#maintain_data_type) — detectable via its meta.
    def self.vocabulary_for_data_type(data_type)
      return nil unless data_type.is_entity
      vocabulary_id = data_type.meta.is_a?(Hash) ? data_type.meta["vocabulary_id"] : nil
      vocabulary_id && Grit::Core::Vocabulary.find_by(id: vocabulary_id)
    end

    def self.export_assay_metadata_definition(definition)
      {
        "name" => definition.name,
        "safe_name" => definition.safe_name,
        "description" => definition.description,
        "vocabulary" => export_vocabulary(definition.vocabulary)
      }
    end

    def self.export_assay_model_metadatum(metadatum)
      { "assay_metadata_definition" => export_assay_metadata_definition(metadatum.assay_metadata_definition) }
    end

    def self.export_assay_data_sheet_column(column)
      vocabulary = vocabulary_for_data_type(column.data_type)
      {
        "name" => column.name,
        "safe_name" => column.safe_name,
        "description" => column.description,
        "sort" => column.sort,
        "required" => column.required,
        "data_type" => column.data_type.name,
        "data_type_vocabulary" => vocabulary && export_vocabulary(vocabulary),
        "unit" => column.unit&.abbreviation
      }
    end

    def self.export_assay_data_sheet_definition(definition)
      {
        "name" => definition.name,
        "description" => definition.description,
        "result" => definition.result,
        "sort" => definition.sort,
        "assay_data_sheet_columns" => definition.assay_data_sheet_columns.map { |column| export_assay_data_sheet_column(column) }
      }
    end

    def self.export_experiment_metadata_template_metadatum(metadatum)
      {
        "assay_metadata_definition" => export_assay_metadata_definition(metadatum.assay_metadata_definition),
        "vocabulary_item" => metadatum.vocabulary_item.name
      }
    end

    def self.export_experiment_metadata_template(template)
      {
        "name" => template.name,
        "description" => template.description,
        "experiment_metadata_template_metadata" => template.experiment_metadata_template_metadata.map { |metadatum| export_experiment_metadata_template_metadatum(metadatum) }
      }
    end

    private_class_method :export_assay_type, :export_vocabulary_item, :export_vocabulary, :vocabulary_for_data_type,
      :export_assay_metadata_definition, :export_assay_model_metadatum, :export_assay_data_sheet_column,
      :export_assay_data_sheet_definition, :export_experiment_metadata_template_metadatum,
      :export_experiment_metadata_template

    def self.find_publication_status!(name)
      Grit::Core::PublicationStatus.find_by(name: name) || raise("Publication status '#{name}' not found in target database")
    end

    def self.find_data_type!(name)
      Grit::Core::DataType.find_by(name: name) || raise("Data type '#{name}' not found in target database")
    end

    def self.find_unit!(abbreviation)
      Grit::Core::Unit.find_by(abbreviation: abbreviation) || raise("Unit '#{abbreviation}' not found in target database")
    end

    def self.import_assay_type(attrs)
      Grit::Assays::AssayType.create!(name: attrs.fetch("name"), description: attrs["description"])
    end

    def self.import_vocabulary!(vocabulary_attrs)
      vocabulary = Grit::Core::Vocabulary.find_or_create_by!(name: vocabulary_attrs.fetch("name")) do |record|
        record.description = vocabulary_attrs["description"]
      end

      Array(vocabulary_attrs["vocabulary_items"]).each do |item_attrs|
        vocabulary.vocabulary_items.find_or_create_by!(name: item_attrs.fetch("name")) do |record|
          record.description = item_attrs["description"]
        end
      end

      vocabulary
    end

    def self.import_or_find_assay_metadata_definition(definition_attrs)
      vocabulary = import_vocabulary!(definition_attrs.fetch("vocabulary"))

      Grit::Assays::AssayMetadataDefinition.find_or_create_by!(safe_name: definition_attrs.fetch("safe_name")) do |record|
        record.name = definition_attrs.fetch("name")
        record.description = definition_attrs["description"]
        record.vocabulary = vocabulary
      end
    end

    def self.import_assay_model_metadatum(assay_model, metadatum_attrs)
      metadata_definition = import_or_find_assay_metadata_definition(metadatum_attrs.fetch("assay_metadata_definition"))
      Grit::Assays::AssayModelMetadatum.create!(assay_model: assay_model, assay_metadata_definition: metadata_definition)
    end

    def self.import_assay_data_sheet_definition(assay_model, definition_attrs)
      data_sheet_definition = Grit::Assays::AssayDataSheetDefinition.create!(
        assay_model: assay_model,
        name: definition_attrs.fetch("name"),
        description: definition_attrs["description"],
        result: definition_attrs["result"],
        sort: definition_attrs["sort"]
      )

      Array(definition_attrs["assay_data_sheet_columns"]).each do |column_attrs|
        # Creates the vocabulary-backed DataType as a side effect (Vocabulary#maintain_data_type),
        # so find_data_type! below can resolve it even if it didn't already exist in this database.
        import_vocabulary!(column_attrs["data_type_vocabulary"]) if column_attrs["data_type_vocabulary"]

        Grit::Assays::AssayDataSheetColumn.create!(
          assay_data_sheet_definition: data_sheet_definition,
          name: column_attrs.fetch("name"),
          safe_name: column_attrs.fetch("safe_name"),
          description: column_attrs["description"],
          sort: column_attrs["sort"],
          required: column_attrs["required"],
          data_type: find_data_type!(column_attrs.fetch("data_type")),
          unit: column_attrs["unit"].present? ? find_unit!(column_attrs["unit"]) : nil
        )
      end
    end

    def self.import_experiment_metadata_template_metadatum(template, metadatum_attrs)
      metadata_definition = import_or_find_assay_metadata_definition(metadatum_attrs.fetch("assay_metadata_definition"))
      vocabulary_item = metadata_definition.vocabulary.vocabulary_items.find_by!(name: metadatum_attrs.fetch("vocabulary_item"))

      Grit::Assays::ExperimentMetadataTemplateMetadatum.find_or_create_by!(
        experiment_metadata_template: template,
        assay_metadata_definition: metadata_definition
      ) do |record|
        record.vocabulary = metadata_definition.vocabulary
        record.vocabulary_item = vocabulary_item
      end
    end

    def self.import_experiment_metadata_template(template_attrs)
      template = Grit::Assays::ExperimentMetadataTemplate.find_or_create_by!(name: template_attrs.fetch("name")) do |record|
        record.description = template_attrs["description"]
      end

      Array(template_attrs["experiment_metadata_template_metadata"]).each do |metadatum_attrs|
        import_experiment_metadata_template_metadatum(template, metadatum_attrs)
      end

      template
    end
    private_class_method :find_publication_status!, :find_data_type!, :find_unit!, :import_assay_type, :import_vocabulary!,
      :import_or_find_assay_metadata_definition, :import_assay_model_metadatum, :import_assay_data_sheet_definition,
      :import_experiment_metadata_template_metadatum, :import_experiment_metadata_template

    def self.selected_entry!(dump, section, name)
      config = SECTIONS.fetch(section)
      attrs = dump[section].find { |entry| entry["name"] == name }
      raise "#{config[:label]} '#{name}' is not in the file" if attrs.nil?
      raise "#{config[:label]} '#{name}' already exists" if installed?(section, attrs)
      attrs
    end

    def self.installed?(section, attrs)
      scope = SECTIONS.fetch(section)[:model].constantize
      return scope.where(name: attrs["name"]).or(scope.where(safe_name: attrs["safe_name"])).exists? if section == "assay_metadata_definitions"
      scope.exists?(name: attrs["name"])
    end

    def self.dependency(kind, name, installed, note = nil)
      { "kind" => kind, "name" => name, "installed" => installed, "note" => note }
    end

    def self.vocabulary_dependency(vocabulary_attrs)
      vocabulary = Grit::Core::Vocabulary.find_by(name: vocabulary_attrs.fetch("name"))
      missing = vocabulary ? missing_vocabulary_items(vocabulary, vocabulary_attrs) : []
      note = "#{missing.size} missing item(s) will be added: #{missing.join(', ')}" if missing.any?
      dependency("Vocabulary", vocabulary_attrs["name"], vocabulary.present?, note)
    end

    def self.missing_vocabulary_items(vocabulary, vocabulary_attrs)
      Array(vocabulary_attrs["vocabulary_items"]).map { |item| item["name"] } - vocabulary.vocabulary_items.pluck(:name)
    end

    def self.metadata_definition_dependencies(definition_attrs)
      installed = Grit::Assays::AssayMetadataDefinition.exists?(safe_name: definition_attrs.fetch("safe_name"))
      [
        dependency("Metadata definition", definition_attrs["name"], installed),
        vocabulary_dependency(definition_attrs.fetch("vocabulary"))
      ]
    end

    def self.preview_entry(section, attrs, dependencies: [], problems: [], extra: {})
      {
        "name" => attrs["name"],
        "description" => attrs["description"],
        "installed" => installed?(section, attrs),
        "dependencies" => dependencies.uniq { |dep| [ dep["kind"], dep["name"] ] },
        "problems" => problems.uniq
      }.merge(extra)
    end

    def self.preview_assay_model(attrs)
      assay_type_name = attrs.dig("assay_type", "name")
      assay_type = Grit::Assays::AssayType.find_by(name: assay_type_name)
      assay_type_note = "its description differs from the one in the file and will be kept" if assay_type && assay_type.description.to_s != attrs.dig("assay_type", "description").to_s
      dependencies = [ dependency("Assay type", assay_type_name, assay_type.present?, assay_type_note) ]
      problems = []

      Array(attrs["assay_model_metadata"]).each do |metadatum_attrs|
        dependencies.concat(metadata_definition_dependencies(metadatum_attrs.fetch("assay_metadata_definition")))
      end

      Array(attrs["assay_data_sheet_definitions"]).flat_map { |sheet| Array(sheet["assay_data_sheet_columns"]) }.each do |column_attrs|
        if column_attrs["data_type_vocabulary"]
          dependencies << vocabulary_dependency(column_attrs["data_type_vocabulary"])
        elsif !Grit::Core::DataType.exists?(name: column_attrs["data_type"])
          problems << "Data type '#{column_attrs['data_type']}' not found"
        end
        if column_attrs["unit"].present? && !Grit::Core::Unit.exists?(abbreviation: column_attrs["unit"])
          problems << "Unit '#{column_attrs['unit']}' not found"
        end
      end

      preview_entry("assay_models", attrs, dependencies: dependencies, problems: problems, extra: {
        "assay_type" => assay_type_name,
        "publication_status" => attrs["publication_status"]
      })
    end

    def self.preview_vocabulary(attrs)
      vocabulary = Grit::Core::Vocabulary.find_by(name: attrs["name"])
      preview_entry("vocabularies", attrs, extra: {
        "item_count" => Array(attrs["vocabulary_items"]).size,
        "missing_items" => vocabulary ? missing_vocabulary_items(vocabulary, attrs) : []
      })
    end

    def self.preview_assay_metadata_definition(attrs)
      preview_entry("assay_metadata_definitions", attrs,
        dependencies: [ vocabulary_dependency(attrs.fetch("vocabulary")) ],
        extra: { "safe_name" => attrs["safe_name"], "vocabulary" => attrs.dig("vocabulary", "name") })
    end

    def self.preview_experiment_metadata_template(attrs)
      dependencies = Array(attrs["experiment_metadata_template_metadata"]).flat_map do |metadatum_attrs|
        metadata_definition_dependencies(metadatum_attrs.fetch("assay_metadata_definition"))
      end
      preview_entry("experiment_metadata_templates", attrs, dependencies: dependencies)
    end
    private_class_method :selected_entry!, :installed?, :preview_assay_metadata_definition, :dependency, :vocabulary_dependency, :missing_vocabulary_items,
      :metadata_definition_dependencies, :preview_entry, :preview_assay_model, :preview_vocabulary,
      :preview_experiment_metadata_template
  end
end
