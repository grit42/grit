import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit/client-library/components";
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
  useForm,
} from "@grit/form";
import { useQueryClient } from "@grit/api";
import {
  useCreateEntityMutation,
  useEditEntityMutation,
  useDestroyEntityMutation,
  EntityFormFieldDef,
  useHasRoles,
} from "@grit/core";
import { useMemo, useState } from "react";
import styles from "../../experiments.module.scss";
import {
  ExperimentData,
  useExperiment,
  useExperimentFields,
} from "../../../../queries/experiments";
import { useAssay, useAssayFields } from "../../../../queries/assays";
import { classnames } from "@grit/client-library/utils";

const ORGANIZED_FIELDS = ["assay_id", "name", "description"] as const;
type OrganizedFields = (typeof ORGANIZED_FIELDS)[number];

type ExperimentFormFields = {
  [key in OrganizedFields]?: FormFieldDef;
} & {
  rest: FormFieldDef[];
};

const AssayMetadata = ({ assayId }: { assayId: number }) => {
  const {
    data: assay,
    isLoading: isAssayLoading,
    isError: isAssayError,
    error: assayError,
  } = useAssay(assayId);
  const {
    data: assayFields,
    isLoading: isAssayFieldsLoading,
    isError: isAssayFieldsError,
    error: assayFieldsError,
  } = useAssayFields(
    { assay_id: assayId.toString() },
    {
      select: (data) =>
        data.filter(({ metadata_definition_id }) => !!metadata_definition_id),
    },
  );

  const metadata = useMemo(
    () =>
      assay &&
      assayFields?.map((f) => ({
        key: f.name,
        label: f.display_name,
        value:
          assay[
            (f as any).entity
              ? `${f.name}__${(f as any).entity.display_column}`
              : f.name
          ] as string,
      })),
    [assay, assayFields],
  );

  if (isAssayLoading || isAssayFieldsLoading) {
    return <Spinner />;
  }

  if (isAssayError || isAssayFieldsError || !assay || !assayFields) {
    return <ErrorPage error={assayError ?? assayFieldsError} />;
  }

  return (
    <Surface
      style={{
        width: "20vw",
        maxWidth: "20vw",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing)",
        overflow: "auto",
      }}
    >
      <em>Assay</em>
      <Link to={`/assays/assays/${assay.id}`}>
        <h3>{assay.name}</h3>
      </Link>
      <em>Assay model</em>
      <h3>{assay.assay_model_id__name}</h3>
      <em>Assay type</em>
      <h3>{assay.assay_type_id__name}</h3>
      <em>Metadata</em>
      {metadata?.length && (
        <div
          style={{ display: "flex", gap: "var(--spacing)", flexWrap: "wrap" }}
        >
          {metadata.map((m) => (
            <span
              key={m.key}
              style={{
                backgroundColor: "rgb(from var(--palette-info-main) r g b / 0.5)",
                padding: "calc(var(--spacing) / 2)",
                borderRadius: "var(--border-radius)",
                textWrap: "nowrap",
              }}
            >
              <strong>
                {m.label}: {m.value}
              </strong>
            </span>
          ))}
        </div>
      )}
    </Surface>
  );
};

const ExperimentForm = ({
  fields,
  experiment,
}: {
  fields: FormFieldDef[];
  experiment: Partial<ExperimentData>;
}) => {
  const canCrudExperiment = useHasRoles(["Administrator", "AssayAdministrator", "AssayUser"])

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const assay_id = searchParams.has("assay_id")
    ? Number(searchParams.get("assay_id"))
    : undefined;
  const [formData, setFormData] = useState<Partial<ExperimentData>>({
    assay_id,
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
        `Are you sure you want to delete this assay type? This action is irreversible`,
      )
    ) {
      return;
    }
    await destroyEntityMutation.mutateAsync(experiment.id);
    navigate("../..");
  };

  const {
    assay_id: assay_id_field,
    name: name_field,
    description: description_field,
    rest,
  } = useMemo(() => {
    return fields.reduce(
      (acc, f) => {
        switch (f.name) {
          case "assay_id":
            const entityField = f as EntityFormFieldDef;
            acc.assay_id = {
              ...entityField,
              hidden: !!experiment.id,
              disabled: !canCrudExperiment,
              entity: { ...entityField.entity, params: { scope: "published" } },
            } as EntityFormFieldDef;
            break;
          case "name":
          case "description":
            acc[f.name] = {...f, disabled: !canCrudExperiment};
            break;
          default:
            acc.rest.push({...f, disabled: !canCrudExperiment});
        }
        return acc;
      },
      { rest: [] } as ExperimentFormFields,
    );
  }, [fields, experiment]);

  if (!assay_id_field || !name_field || !description_field) {
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
      })}
    >
      {experiment.assay_id && <AssayMetadata assayId={experiment.assay_id} />}
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
              gridTemplateColumns: experiment.id ? "1fr" : "1fr 1fr",
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
            <FormField form={form} fieldDef={name_field} />
            <FormField form={form} fieldDef={assay_id_field} />
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: -1,
              }}
            >
              <FormField form={form} fieldDef={description_field} />
            </div>
            {rest.map((f) => (
              <FormField form={form} fieldDef={f} key={f.name} />
            ))}
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
