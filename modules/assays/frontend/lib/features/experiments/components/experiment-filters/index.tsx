import {
  Button,
  ErrorPage,
  Input,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { EntityFormFieldEntity, EntitySelector } from "@grit42/core";
import { useEffect, useMemo, useState } from "react";
import { useAssayModelMetadata } from "../../../../queries/assay_model_metadata";
import { useAssayMetadataDefinitions } from "../../../../queries/assay_metadata_definitions";
import { useAssayModels } from "../../../../queries/assay_models";
import { useDebounceCallback } from "usehooks-ts";

export interface ExperimentFilterValues {
  assay_type_id?: number[];
  assay_model_id?: number[];
  name?: string;
  [key: string]: number[] | string | undefined;
}

const ASSAY_TYPE_ENTITY: EntityFormFieldEntity = {
  name: "Assay type",
  full_name: "Grit::Assays::AssayType",
  path: `grit/assays/assay_types`,
  primary_key: "id",
  primary_key_type: "integer",
  column: "assay_type_id__name",
  display_column: "name",
  display_column_type: "string",
  multiple: true,
};

const ASSAY_MODEL_ENTITY: EntityFormFieldEntity = {
  name: "Assay model",
  full_name: "Grit::Assays::AssayModel",
  path: `grit/assays/assay_models`,
  primary_key: "id",
  primary_key_type: "integer",
  column: "assay_model_id__name",
  display_column: "name",
  display_column_type: "string",
  multiple: true,
};

interface Props {
  assayModelId?: string | number;
  filterValues: ExperimentFilterValues;
  setFilterValues: (
    v:
      | ExperimentFilterValues
      | ((prev: ExperimentFilterValues | undefined) => ExperimentFilterValues),
  ) => void;
  identifier?: "safe_name" | "metadata_definition_id";
  label?: string;
  showAssayType?: boolean;
  showAssayModel?: boolean;
  showName?: boolean;
}

const ExperimentFiltersSidebar = ({
  assayModelId,
  filterValues,
  setFilterValues,
  identifier = "safe_name",
  showAssayType = false,
  showAssayModel = false,
  showName = false,
  label = "Filters",
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

  const [experimentName, setExperimentName] = useState(filterValues.name ?? "");
  const { data: assayModels } = useAssayModels(
    undefined,
    undefined,
    undefined,
    { enabled: !!assayModelId },
  );

  const setAssayTypeFilter = (v: number | number[] | null) =>
    setFilterValues((prev = {}) => {
      const newState = { ...prev };
      if (Array.isArray(v) && v.length > 0) {
        newState.assay_type_id = v;
      } else if (!Array.isArray(v) && v) {
        newState.assay_type_id = [v];
      } else {
        delete newState.assay_type_id;
      }
      if (assayModels && newState.assay_type_id) {
        const typesModels = assayModels.filter(({ assay_type_id }) =>
          newState.assay_type_id?.includes(assay_type_id),
        );
        newState.assay_model_id = newState.assay_model_id?.filter(
          (assay_model_id) =>
            typesModels.some(({ id }) => assay_model_id === id),
        );
        if (newState.assay_model_id?.length === 0) {
          delete newState.assay_model_id;
        }
      } else if (!assayModels) {
        delete newState.assay_model_id;
      }
      return newState;
    });

  const setAssayModelFilter = (v: number | number[] | null) =>
    setFilterValues((prev = {}) => {
      if (Array.isArray(v) && v.length > 0) {
        return { ...prev, assay_model_id: v };
      } else if (!Array.isArray(v) && v) {
        return { ...prev, assay_model_id: [v] };
      } else {
        const newState = { ...prev };
        delete newState.assay_model_id;
        return newState;
      }
    });

  const setNameFilter = useDebounceCallback(
    (v: string) => setFilterValues((prev = {}) => ({ ...prev, name: v })),
    250,
  );

  useEffect(() => {
    if (experimentName !== filterValues.name) {
      setNameFilter(experimentName);
      return setNameFilter.cancel;
    }
  }, [experimentName, filterValues.name, setNameFilter]);

  const metadataFields = useMemo(() => {
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

  if (metadataFields?.length == 0) {
    return null;
  }

  const activeFilters = Object.values(filterValues).some((v) => !!v?.length)

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
        <h2>{label}</h2>
        {activeFilters && (
          <Button
            color="primary"
            onClick={() => {
              setFilterValues({name: ""});
              setExperimentName("");
            }}
          >
            Clear
          </Button>
        )}
      </div>
      {showAssayType && (
        <EntitySelector
          entity={ASSAY_TYPE_ENTITY}
          onChange={setAssayTypeFilter}
          onBlur={() => void 0}
          label="Assay type"
          value={filterValues.assay_type_id}
          error=""
          multiple
        />
      )}
      {showAssayModel && (
        <EntitySelector
          entity={{
            ...ASSAY_MODEL_ENTITY,
            filters: [
              {
                active: true,
                column: "assay_type_id",
                id: "assay_type_id",
                operator: "in_list",
                property: "assay_type_id",
                property_type: "integer",
                type: "integer",
                value: filterValues.assay_type_id,
              },
            ],
          }}
          onChange={setAssayModelFilter}
          onBlur={() => void 0}
          label="Assay model"
          value={filterValues.assay_model_id}
          error=""
          multiple
        />
      )}
      {showName && (
        <Input
          label="Experiment name"
          placeholder="Experiment name"
          type="string"
          onChange={(e) => setExperimentName(e.target.value)}
          value={experimentName}
        />
      )}
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
      {metadataFields?.map((f) => (
        <div key={f.name}>
          <EntitySelector
            entity={f.entity}
            onChange={(v) =>
              setFilterValues((prev = {}) => {
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
            value={filterValues[f[identifier]] as number[] | undefined}
            error=""
            multiple
          />
        </div>
      ))}
    </Surface>
  );
};

export default ExperimentFiltersSidebar;
