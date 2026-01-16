import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { EntitySelector } from "@grit42/core";
import { useMemo } from "react";
import { useAssayModelMetadata } from "../../../../queries/assay_model_metadata";
import { useAssayMetadataDefinitions } from "../../../../queries/assay_metadata_definitions";

interface Props {
  assayModelId?: string | number;
  metadataFilters: Record<string, number[]>;
  identifier?: "safe_name" | "metadata_definition_id";
  setMetadataFilters: (
    v:
      | Record<string, number[]>
      | ((prev: Record<string, number[]> | undefined) => Record<string, number[]>),
  ) => void;
}

const ExperimentMetadataFilters = ({
  assayModelId,
  metadataFilters,
  setMetadataFilters,
  identifier = "safe_name",
}: Props) => {
  const {
    data: modelMetadata,
    isLoading: isModelMetadataLoading,
    isError: isModelMetadataError,
    error: modelMetadataError,
  } = useAssayModelMetadata(
    assayModelId ?? -1,
    undefined,
    undefined,
    undefined,
    { enabled: !!assayModelId },
  );

  const {
    data: metadataDefinitions,
    isLoading: isMetadataDefinitionsLoading,
    isError: isMetadataDefinitionsError,
    error: metadataDefinitionsError,
  } = useAssayMetadataDefinitions();

  const fields = useMemo(() => {
    return metadataDefinitions
      ?.map((md) => ({
        name: md.safe_name,
        display_name: md.name,
        description: md.description,
        type: "entity",
        required: false,
        default: null,
        entity: {
          name: md.name,
          full_name: "Grit::Core::VocabularyItem",
          path: `grit/core/vocabularies/${md.vocabulary_id}/vocabulary_items`,
          primary_key: "id",
          primary_key_type: "integer",
          column: md.name,
          display_column: "name",
          display_column_type: "string",
          multiple: true,
        },
        metadata_definition_id: md.id,
        safe_name: md.safe_name,
        belongsToAssayModel:
          modelMetadata?.some(
            (mm) => mm.assay_metadata_definition_id == md.id,
          ) ?? false,
      }))
      .sort((a, b) => {
        if (a.belongsToAssayModel && !b.belongsToAssayModel) return -1;
        if (!a.belongsToAssayModel && b.belongsToAssayModel) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [metadataDefinitions, modelMetadata]);

  if (isMetadataDefinitionsLoading || isModelMetadataLoading) {
    return <Spinner />;
  }

  if (isMetadataDefinitionsError || !metadataDefinitions) {
    return <ErrorPage error={metadataDefinitionsError} />;
  }

  if (fields?.length == 0) {
    return null;
  }

  return (
    <Surface
      style={{
        display: "grid",
        gridTemplateColumns: "20vw",
        gap: "calc(var(--spacing) * 2)",
        gridAutoRows: "max-content",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Metadata filters</h2>
        {metadataFilters && Object.keys(metadataFilters).length > 0 && (
          <Button color="primary" onClick={() => setMetadataFilters({})}>
            Clear
          </Button>
        )}
      </div>
      {isModelMetadataError && (
        <div
          style={{
            color: "var(--palette-error-main)",
          }}
        >
          {modelMetadataError ??
            "An error occured retrieving the required metadata for the selected assay model"}
        </div>
      )}
      {fields?.map((f) => (
        <div key={f.name}>
          <EntitySelector
            entity={f.entity}
            onChange={(v) =>
              setMetadataFilters((prev = {}) => {
                if (Array.isArray(v) && v.length > 0) {
                  return { ...prev, [f[identifier]]: v };
                } else if (!Array.isArray(v) && v) {
                  return { ...prev, [f[identifier]]: [v] };
                } else {
                  const newState = { ...prev };
                  delete newState[f[identifier]];
                  return newState;
                }
              })
            }
            onBlur={() => void 0}
            label={f.display_name}
            description={f.description ?? undefined}
            placeholder={f.display_name}
            value={metadataFilters[f[identifier]]}
            error=""
            multiple
          />
        </div>
      ))}
    </Surface>
  );
};

export default ExperimentMetadataFilters;
