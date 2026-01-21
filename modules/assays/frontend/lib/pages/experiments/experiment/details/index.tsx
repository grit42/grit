import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  ReactFormExtendedApi,
  useForm,
  useStore,
} from "@grit42/form";
import { useQueryClient } from "@grit42/api";
import {
  useCreateEntityMutation,
  useEditEntityMutation,
  useDestroyEntityMutation,
  EntityFormFieldDef,
  useHasRoles,
} from "@grit42/core";
import { useEffect, useMemo, useState } from "react";
import styles from "../../experiments.module.scss";
import {
  ExperimentData,
  useExperiment,
  useExperimentFields,
} from "../../../../queries/experiments";
import { classnames } from "@grit42/client-library/utils";
import { useAssayModelMetadata } from "../../../../queries/assay_model_metadata";
import { useAssayMetadataDefinitions } from "../../../../queries/assay_metadata_definitions";
import ExperimentMetadataTemplatesTableWrapper from "./ExperimentMetadataTemplatesTable";
import { ExperimentMetadataTemplateData } from "../../../../queries/experiment_metadata_templates";
import MetadataDefintionSelectorDialog from "../../../../features/data-tables/data-table/columns/assay_data_sheet_columns/MetadataDefinitionSelectorDialog";
import Circle1CloseIcon from "@grit42/client-library/icons/Circle1Close";

const ExperimentMetadataTemplates = ({
  onSelect,
}: {
  onSelect: (template: ExperimentMetadataTemplateData) => void;
}) => {
  const {
    data: metadataDefinitions,
    isLoading: isMetadataDefinitionsLoading,
    isError: isMetadataDefinitionsError,
    error: metadataDefinitionsError,
  } = useAssayMetadataDefinitions();

  if (isMetadataDefinitionsLoading) {
    return <Spinner />;
  }

  if (isMetadataDefinitionsError || !metadataDefinitions) {
    return <ErrorPage error={metadataDefinitionsError} />;
  }

  return (
    <ExperimentMetadataTemplatesTableWrapper
      onRowClick={({ original }) => onSelect(original)}
    />
  );
};

const ExperimentMetadataForm = ({
  form,
}: {
  form: ReactFormExtendedApi<Partial<ExperimentData>, undefined>;
}) => {
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [selectedMetadataDefinitions, setSelectedMetadataDefinitions] =
    useState<number[] | null>(null);
  const { assay_model_id, values } = useStore<any>(
    form.baseStore,
    ({ values }) => ({ assay_model_id: values.assay_model_id, values }),
  );

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

  const applyMetadataTemplate = (template: ExperimentMetadataTemplateData) => {
    const newSelectedMetadataDefinitions: number[] = [];
    metadataDefinitions?.forEach(({ id, safe_name }) => {
      if (template[safe_name]) {
        form.setFieldValue(safe_name, template[safe_name]);
        form.setFieldMeta("safe_name", (prev: any) => ({
          ...prev,
          errorMap: {},
        }));
        newSelectedMetadataDefinitions.push(id);
      }
    });
    if (newSelectedMetadataDefinitions.length) {
      setSelectedMetadataDefinitions((prev) =>
        prev
          ? [...prev, ...newSelectedMetadataDefinitions]
          : newSelectedMetadataDefinitions,
      );
    }
  };

  useEffect(() => {
    if (
      selectedMetadataDefinitions === null &&
      metadataDefinitions &&
      modelMetadata
    ) {
      setSelectedMetadataDefinitions(
        metadataDefinitions
          .filter(
            (md) =>
              !!values[md.safe_name] ||
              modelMetadata.find(
                ({ assay_metadata_definition_id }) =>
                  assay_metadata_definition_id === md.id,
              ),
          )
          .map(({ id }) => id),
      );
    }
  }, [metadataDefinitions, modelMetadata, selectedMetadataDefinitions, values]);

  const fields = useMemo(() => {
    return metadataDefinitions
      ?.filter((md) => selectedMetadataDefinitions?.find((id) => id === md.id))
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
          disabled: false,
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
  }, [metadataDefinitions, selectedMetadataDefinitions, modelMetadata]);

  if (isMetadataDefinitionsLoading) {
    return <Spinner />;
  }

  if (isMetadataDefinitionsError || !metadataDefinitions) {
    return <ErrorPage error={metadataDefinitionsError} />;
  }

  // if (fields?.length == 0) {
  //   return null;
  // }

  const onClose = (id?: number) => {
    if (id) {
      setSelectedMetadataDefinitions((prev) => (prev ? [...prev, id] : prev));
    }
    setSelectorOpen(false);
  };

  console.log(selectedMetadataDefinitions);

  return (
    <>
      <h2
        style={{
          gridColumnStart: 1,
          gridColumnEnd: -1,
        }}
      >
        Metadata
      </h2>
      {isModelMetadataError && (
        <div
          style={{
            gridColumnStart: 1,
            gridColumnEnd: -1,
            color: "var(--palette-error-main)",
          }}
        >
          {modelMetadataError ??
            "An error occured retrieving the required metadata for the selected assay model"}
        </div>
      )}
      {isModelMetadataLoading && (
        <div
          style={{
            gridColumnStart: 1,
            gridColumnEnd: -1,
          }}
        >
          <Spinner size={14} />
          <span>Loading required metadata for the selected assay model...</span>
        </div>
      )}
      {fields?.map((f) => (
        <div
          key={f.name}
          style={{
            display: "grid",
            gridTemplateColumns: f.belongsToAssayModel
              ? "1fr"
              : "1fr min-content",
            gap: "var(--spacing)",
          }}
        >
          <FormField key={f.name} form={form} fieldDef={f} />

          {!f.belongsToAssayModel && (
            <Button
              style={{
                margin: 0,
                height: "min-content",
                width: "min-content",
                minWidth: "unset",
                alignSelf: "flex-end",
              }}
              onClick={() => {
                console.log(f.assay_metadata_definition_id);
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
          )}
        </div>
      ))}
      {selectorOpen && (
        <MetadataDefintionSelectorDialog
          onClose={onClose}
          selectedMetadataDefinitions={Array.from(
            selectedMetadataDefinitions?.values() ?? [],
          )}
        />
      )}
      {selectedMetadataDefinitions?.length !== metadataDefinitions.length && (
        <Button
          style={{ gridColumnStart: 1 }}
          onClick={() => setSelectorOpen(true)}
        >
          Add metadata
        </Button>
      )}
      {!values.id && (
        <div
          style={{
            position: "absolute",
            right: "calc(-40vw - 16px)",
            top: 0,
            bottom: 0,
            width: "40vw",
          }}
        >
          <ExperimentMetadataTemplates onSelect={applyMetadataTemplate} />
        </div>
      )}
    </>
  );
};

type OrganizedFields = [
  "assay_model_id",
  "name",
  "description",
  "publication_status_id",
][number];

type ExperimentFormFields = {
  [key in OrganizedFields]?: FormFieldDef;
} & {
  rest: FormFieldDef[];
};

const ExperimentForm = ({
  fields,
  experiment,
}: {
  fields: FormFieldDef[];
  experiment: Partial<ExperimentData>;
}) => {
  const canCrudExperiment = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const assay_model_id = searchParams.has("assay_model_id")
    ? Number(searchParams.get("assay_model_id"))
    : undefined;
  const [formData, setFormData] = useState<Partial<ExperimentData>>({
    assay_model_id,
    ...experiment,
  });

  const createEntityMutation = useCreateEntityMutation<ExperimentData>(
    "grit/assays/experiments",
  );

  const editEntityMutation = useEditEntityMutation<ExperimentData>(
    "grit/assays/experiments",
    experiment.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/experiments",
  );

  const form = useForm<Partial<ExperimentData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<ExperimentData>>(
        formValue,
        fields,
      );
      if (!experiment.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as ExperimentData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/experiments",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
        navigate(`../${newEntity.id}/details`, {
          relative: "path",
          replace: true,
        });
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as ExperimentData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !experiment.id ||
      !window.confirm(
        `Are you sure you want to delete this experiment? This action is irreversible`,
      )
    ) {
      return;
    }
    await destroyEntityMutation.mutateAsync(experiment.id);
    navigate("../..");
  };

  const {
    assay_model_id: assay_model_id_field,
    name: name_field,
    description: description_field,
    publication_status_id: publication_status_id_field,
  } = useMemo(() => {
    return fields.reduce(
      (acc, f) => {
        const entityField = f as EntityFormFieldDef;
        switch (f.name) {
          case "assay_model_id":
            acc.assay_model_id = {
              ...entityField,
              disabled: !!experiment.id || !canCrudExperiment,
              entity: { ...entityField.entity, params: { scope: "published" } },
            } as EntityFormFieldDef;
            break;
          case "name":
          case "description":
          case "publication_status_id":
            acc[f.name] = { ...f, disabled: !canCrudExperiment };
            break;
          default:
            acc.rest.push({ ...f, disabled: !canCrudExperiment });
        }
        return acc;
      },
      { rest: [] } as ExperimentFormFields,
    );
  }, [fields, experiment.id, canCrudExperiment]);

  if (
    !assay_model_id_field ||
    !name_field ||
    !description_field ||
    !publication_status_id_field
  ) {
    return (
      <ErrorPage>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <div
      className={classnames(styles.experiment, {
        [styles.withAssayInfo]: !!experiment.assay_id,
        [styles.withMetadataTemplates]: !experiment.assay_id,
      })}
    >
      <Surface className={styles.modelForm}>
        {!experiment.id && (
          <h2 style={{ alignSelf: "baseline", marginBottom: ".5em" }}>
            New experiment
          </h2>
        )}
        <Form<Partial<ExperimentData>> form={form}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gridAutoRows: "max-content",
              gap: "calc(var(--spacing) * 2)",
              paddingBottom: "calc(var(--spacing) * 2)",
            }}
          >
            {form.state.errorMap.onSubmit && (
              <div
                style={{
                  gridColumnStart: 1,
                  gridColumnEnd: -1,
                  color: "var(--palette-error-main)",
                }}
              >
                {form.state.errorMap.onSubmit?.toString()}
              </div>
            )}
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: -1,
              }}
            >
              <FormField form={form} fieldDef={assay_model_id_field} />
            </div>
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: -1,
              }}
            >
              <FormField form={form} fieldDef={name_field} />
            </div>
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: -1,
              }}
            >
              <FormField form={form} fieldDef={publication_status_id_field} />
            </div>
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: -1,
              }}
            >
              <FormField form={form} fieldDef={description_field} />
            </div>
            <ExperimentMetadataForm form={form} />
          </div>
          <FormControls
            form={form}
            onDelete={onDelete}
            showDelete={!!experiment.id && canCrudExperiment}
            showCancel
            cancelLabel={experiment.id ? "Back" : "Cancel"}
            onCancel={() => navigate(experiment.id ? "../.." : "..")}
            isDeleting={destroyEntityMutation.isPending}
          />
        </Form>
      </Surface>
    </div>
  );
};

const Details = () => {
  const { experiment_id } = useParams() as { experiment_id: string };
  const {
    data: fields,
    isLoading: isExperimentFieldsLoading,
    isError: isExperimentFieldsError,
    error: experimentFieldsError,
  } = useExperimentFields();

  const { data, isLoading, isError, error } = useExperiment(experiment_id);

  if (isExperimentFieldsLoading || isLoading) return <Spinner />;
  if (isExperimentFieldsError || isError || !fields || !data)
    return <ErrorPage error={experimentFieldsError ?? error} />;
  return <ExperimentForm fields={fields} experiment={data} />;
};

export default Details;
