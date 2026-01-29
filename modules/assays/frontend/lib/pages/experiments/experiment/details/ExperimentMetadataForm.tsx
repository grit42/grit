import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { FormField, ReactFormExtendedApi, useStore } from "@grit42/form";
import { EntityFormFieldDef } from "@grit42/core";
import { useMemo, useState } from "react";
import { ExperimentData } from "../../../../queries/experiments";
import { useAssayModelMetadata } from "../../../../queries/assay_model_metadata";
import { useAssayMetadataDefinitions } from "../../../../queries/assay_metadata_definitions";
import Circle1CloseIcon from "@grit42/client-library/icons/Circle1Close";
import styles from "./details.module.scss";
import { MetadataDefintionSelector } from "../../../../features/assay-metadata-definitions";

const ExperimentMetadataForm = ({
  form,
  disabled,
}: {
  form: ReactFormExtendedApi<Partial<ExperimentData>, undefined>;
  disabled: boolean;
}) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedMetadataDefinitions, setSelectedMetadataDefinitions] =
    useState<number[]>([]);
  const { assay_model_id, values } = useStore(form.baseStore, ({ values }) => ({
    assay_model_id: values.assay_model_id,
    values,
  }));

  const {
    data: modelMetadata,
    isLoading: isModelMetadataLoading,
    isError: isModelMetadataError,
    error: modelMetadataError,
  } = useAssayModelMetadata(
    assay_model_id ?? -1,
    undefined,
    undefined,
    undefined,
    { enabled: !!assay_model_id },
  );

  const {
    data: metadataDefinitions,
    isLoading: isMetadataDefinitionsLoading,
    isError: isMetadataDefinitionsError,
    error: metadataDefinitionsError,
  } = useAssayMetadataDefinitions();

  const metadataWithValues = useMemo(
    () =>
      metadataDefinitions
        ?.filter(
          ({ safe_name }) =>
            Object.hasOwn(values, safe_name) && values[safe_name] !== null,
        )
        .map(({ id }) => id),
    [metadataDefinitions, values],
  );

  const displayedMetadata = useMemo(
    () =>
      new Set([
        ...(metadataWithValues ?? []),
        ...(modelMetadata ?? []).map(
          ({ assay_metadata_definition_id }) => assay_metadata_definition_id,
        ),
        ...(selectedMetadataDefinitions ?? []),
      ]),
    [metadataWithValues, modelMetadata, selectedMetadataDefinitions],
  );

  const fields = useMemo(() => {
    return metadataDefinitions
      ?.filter((md) => displayedMetadata.has(md.id))
      .map(
        (
          md,
        ): EntityFormFieldDef & {
          belongsToAssayModel: boolean;
          assay_metadata_definition_id: number;
        } => ({
          name: md.safe_name,
          display_name: md.name,
          type: "entity",
          required: modelMetadata?.some(
            (mm) => mm.assay_metadata_definition_id == md.id,
          ),
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
          },
          disabled: disabled,
          assay_metadata_definition_id: md.id,
          belongsToAssayModel:
            modelMetadata?.some(
              (mm) => mm.assay_metadata_definition_id == md.id,
            ) ?? false,
        }),
      )
      .sort((a, b) => {
        if (a.required && !b.required) return -1;
        if (!a.required && b.required) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [metadataDefinitions, displayedMetadata, modelMetadata, disabled]);

  if (isMetadataDefinitionsLoading) {
    return <Spinner />;
  }

  if (isMetadataDefinitionsError || !metadataDefinitions) {
    return <ErrorPage error={metadataDefinitionsError} />;
  }

  const onClose = (id?: number) => {
    if (id) {
      setSelectedMetadataDefinitions((prev) => (prev ? [...prev, id] : [id]));
    }
    setSelectorOpen(false);
  };

  return (
    <>
      <h2 className={styles.formTitle}>Metadata</h2>
      {isModelMetadataError && (
        <div className={styles.formError}>
          {modelMetadataError ??
            "An error occured retrieving the required metadata for the selected assay model"}
        </div>
      )}
      {isModelMetadataLoading && (
        <div className={styles.formFullwidthField}>
          <Spinner size={14} />
          <span>Loading required metadata for the selected assay model...</span>
        </div>
      )}
      {fields?.map((f) =>
        (f.belongsToAssayModel || disabled) ? (
          <FormField key={f.name} form={form} fieldDef={f} />
        ) : (
          <div key={f.name} className={styles.formExtraMetadataField}>
            <FormField key={f.name} form={form} fieldDef={f} />
            <Button
              onClick={() => {
                setSelectedMetadataDefinitions((prev) =>
                  prev
                    ? prev.filter((id) => id !== f.assay_metadata_definition_id)
                    : prev,
                );
                form.setFieldValue(f.name, null);
              }}
            >
              <Circle1CloseIcon height={16} />
            </Button>
          </div>
        ),
      )}
      {selectorOpen && (
        <MetadataDefintionSelector
          onClose={onClose}
          selectedMetadataDefinitions={Array.from(
            selectedMetadataDefinitions?.values() ?? [],
          )}
        />
      )}
      {selectedMetadataDefinitions?.length !== metadataDefinitions.length && !disabled && (
        <Button
          style={{ gridColumnStart: 1 }}
          onClick={() => setSelectorOpen(true)}
        >
          Add optional metadata
        </Button>
      )}
    </>
  );
};

export default ExperimentMetadataForm;
