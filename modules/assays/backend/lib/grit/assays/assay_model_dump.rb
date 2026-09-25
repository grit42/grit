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
  # Exports/imports Assay Model definitions (type, metadata, data sheet structure,
  # vocabularies, experiment metadata templates) as plain hashes with no ids, so a dump can be
  # moved between databases. Used by both the export/import controller actions on
  # AssayModelsController and the apps/grit/server/script/AssayExportImport/*.rb CLI scripts.
  #
  # Vocabularies (and their items) referenced by a metadata definition or by a vocabulary-backed
  # data sheet column are embedded in full and created in the target database if they don't
  # already exist there (matched/reused by name otherwise), and so is anything they back:
  # Assay Metadata Definitions and Experiment Metadata Templates. Unit and Publication Status
  # are matched by name/abbreviation and are expected to already exist in the target database —
  # import raises if one of those is missing.
  class AssayModelDump
    def self.export_assay_model(assay_model)
      {
        "name" => assay_model.name,
        "description" => assay_model.description,
        "assay_type" => export_assay_type(assay_model.assay_type),
        "publication_status" => assay_model.publication_status.name,
        "assay_model_metadata" => assay_model.assay_model_metadata.map { |metadatum| export_assay_model_metadatum(metadatum) },
        "assay_data_sheet_definitions" => assay_model.assay_data_sheet_definitions.map { |definition| export_assay_data_sheet_definition(definition) },
        "experiment_metadata_templates" => export_experiment_metadata_templates(assay_model)
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

    # Any template that assigns a default value for one of this assay model's metadata
    # definitions is pulled in, even if the same template also covers definitions that belong to
    # other assay models — the template is exported/imported as a whole, not sliced per model.
    def self.export_experiment_metadata_templates(assay_model)
      definition_ids = assay_model.assay_model_metadata.map(&:assay_metadata_definition_id)
      return [] if definition_ids.empty?

      Grit::Assays::ExperimentMetadataTemplate
        .joins(:experiment_metadata_template_metadata)
        .where(experiment_metadata_template_metadata: { assay_metadata_definition_id: definition_ids })
        .distinct
        .map { |template| export_experiment_metadata_template(template) }
    end
    private_class_method :export_assay_type, :export_vocabulary_item, :export_vocabulary, :vocabulary_for_data_type,
      :export_assay_metadata_definition, :export_assay_model_metadatum, :export_assay_data_sheet_column,
      :export_assay_data_sheet_definition, :export_experiment_metadata_template_metadatum,
      :export_experiment_metadata_template, :export_experiment_metadata_templates

    def self.find_publication_status!(name)
      Grit::Core::PublicationStatus.find_by(name: name) || raise("Publication status '#{name}' not found in target database")
    end

    def self.find_data_type!(name)
      Grit::Core::DataType.find_by(name: name) || raise("Data type '#{name}' not found in target database")
    end

    def self.find_unit!(abbreviation)
      Grit::Core::Unit.find_by(abbreviation: abbreviation) || raise("Unit '#{abbreviation}' not found in target database")
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
    private_class_method :find_publication_status!, :find_data_type!, :find_unit!, :import_vocabulary!,
      :import_or_find_assay_metadata_definition, :import_assay_model_metadatum, :import_assay_data_sheet_definition,
      :import_experiment_metadata_template_metadatum, :import_experiment_metadata_template
  end
end
