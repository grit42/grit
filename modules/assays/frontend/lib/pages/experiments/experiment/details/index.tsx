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
  useForm,
} from "@grit42/form";
import {
  EndpointError,
  EndpointErrorErrors,
  EndpointSuccess,
  notifyOnError,
  request,
  useMutation,
  UseMutationOptions,
  useQueryClient,
} from "@grit42/api";
import {
  useCreateEntityMutation,
  useEditEntityMutation,
  useDestroyEntityMutation,
  EntityFormFieldDef,
  useHasRoles,
} from "@grit42/core";
import { useMemo, useState } from "react";
import styles from "./details.module.scss";
import {
  ExperimentData,
  useExperiment,
  useExperimentFields,
} from "../../../../queries/experiments";
import { classnames } from "@grit42/client-library/utils";
import ExperimentMetadataForm from "./ExperimentMetadataForm";
import ExperimentMetadataTemplates from "./ExperimentMetadataTemplates";

type ExperimentFormFields = {
  assay_model_id_field?: FormFieldDef;
  name_field?: FormFieldDef;
  description_field?: FormFieldDef;
};

export const usePublishExperimentMutation = (
  id: string | number,
  mutationOptions: UseMutationOptions<
    ExperimentData,
    EndpointErrorErrors<ExperimentData>
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["publishExperiment", id.toString()],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<ExperimentData>,
        EndpointError<EndpointErrorErrors<ExperimentData>>
      >(`grit/assays/experiments/${id}/publish`, {
        method: "POST",
      });
      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "datum",
            "grit/assays/experiments",
            id.toString(),
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/assays/experiments"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/assays/experiments"],
          refetchType: "all",
        }),
      ]);
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};

export const useDraftExperimentMutation = (
  id: string | number,
  mutationOptions: UseMutationOptions<
    ExperimentData,
    EndpointErrorErrors<ExperimentData>
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["draftExperiment", id.toString()],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<ExperimentData>,
        EndpointError<EndpointErrorErrors<ExperimentData>>
      >(`grit/assays/experiments/${id}/draft`, {
        method: "POST",
      });
      if (!response.success) {
        throw response.errors;
      }

      return response.data;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "datum",
            "grit/assays/experiments",
            id.toString(),
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/assays/experiments"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/assays/experiments"],
          refetchType: "all",
        }),
      ]);
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};

const ExperimentActions = ({
  experiment,
}: {
  experiment: Partial<ExperimentData>;
}) => {
  const navigate = useNavigate();
  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/experiments",
  );

  const publishMutation = usePublishExperimentMutation(experiment.id!);
  const draftMutation = useDraftExperimentMutation(experiment.id!);

  const onDelete = async () => {
    if (
      !experiment.id ||
      !window.confirm(
        `Are you sure you want to delete this Experiment? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(experiment.id);
    navigate("../..");
  };

  const onPublish = async () => {
    if (!experiment.id) {
      return;
    }
    await publishMutation.mutateAsync();
  };

  const onDraft = async () => {
    if (
      !experiment.id ||
      !window.confirm(
        `Are you sure you want to convert this Experiment to draft?`,
      )
    ) {
      return;
    }
    await draftMutation.mutateAsync();
  };

  if (!experiment.id) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
      }}
    >
      {experiment.publication_status_id__name === "Draft" && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--spacing)",
            marginBlock: "calc(var(--spacing)*4)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing)",
            }}
          >
            <h3>Publish this Experiment</h3>
            <p>
              Publishing this Experiment will make it available in Data Tables.
            </p>
          </div>
          <Button
            color="secondary"
            onClick={onPublish}
            loading={publishMutation.isPending}
          >
            Publish
          </Button>
        </div>
      )}
      {experiment.publication_status_id__name === "Published" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr max-content",
            alignItems: "center",
            gap: "var(--spacing)",
            marginBlock: "calc(var(--spacing)*4)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing)",
              maxWidth: "80ch",
            }}
          >
            <h3>Convert this Experiment to Draft</h3>
            <p>
              Converting this Experiment to draft will allow you to make changes
              to its Metadata and Data Sheets. It will not be available in Data
              Tables until it is published again.
            </p>
          </div>
          <Button
            color="danger"
            onClick={onDraft}
            loading={draftMutation.isPending}
          >
            Convert to Draft
          </Button>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr max-content",
          alignItems: "center",
          gap: "var(--spacing)",
          marginBlock: "calc(var(--spacing)*4)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing)",
            maxWidth: "80ch",
          }}
        >
          <h3>Delete this Experiment</h3>
          <p>
            Deleting this Experiment will permanently remove it from the
            database. <b>This action is irreversible.</b>
          </p>
        </div>
        <Button
          color="danger"
          onClick={onDelete}
          loading={destroyEntityMutation.isPending}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

const ExperimentForm = ({
  fields,
  experiment,
}: {
  fields: FormFieldDef[];
  experiment: Partial<ExperimentData>;
}) => {
  const canCrudExperiment =
    useHasRoles(["Administrator", "AssayAdministrator", "AssayUser"]) &&
    experiment.publication_status_id__name !== "Published";

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

  const { assay_model_id_field, name_field, description_field } =
    useMemo(() => {
      const assay_model_id_field = fields.find(
        ({ name }) => name === "assay_model_id",
      ) as EntityFormFieldDef | undefined;
      if (assay_model_id_field) {
        assay_model_id_field.disabled = !!experiment.id || !canCrudExperiment;
        assay_model_id_field.entity = {
          ...assay_model_id_field.entity,
          params: { scope: "published" },
        };
      }
      return {
        assay_model_id_field,
        name_field: {
          ...fields.find(({ name }) => name === "name")!,
          disabled: !canCrudExperiment,
        },
        description_field: {
          ...fields.find(({ name }) => name === "description")!,
          disabled: !canCrudExperiment,
        },
      } satisfies ExperimentFormFields;
    }, [fields, experiment.id, canCrudExperiment]);

  if (!assay_model_id_field || !name_field || !description_field) {
    return (
      <ErrorPage>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <Form<Partial<ExperimentData>>
      form={form}
      className={classnames(styles.container, {
        [styles.withMetadataTemplates]: !experiment.assay_id,
      })}
    >
      <Surface className={styles.form}>
        {!experiment.id && <h2 className={styles.formTitle}>New experiment</h2>}
        <div className={styles.formFields}>
          {form.state.errorMap.onSubmit && (
            <div className={styles.formError}>
              {form.state.errorMap.onSubmit?.toString()}
            </div>
          )}
          <div className={styles.formFullwidthField}>
            <FormField form={form} fieldDef={assay_model_id_field} />
          </div>
          <div className={styles.formFullwidthField}>
            <FormField form={form} fieldDef={name_field} />
          </div>
          <div className={styles.formFullwidthField}>
            <FormField form={form} fieldDef={description_field} />
          </div>
          <ExperimentMetadataForm form={form} disabled={!canCrudExperiment} />
        </div>
        <FormControls
          form={form}
          showCancel
          cancelLabel={experiment.id ? "Back" : "Cancel"}
          onCancel={() => navigate(experiment.id ? "../.." : "..")}
        />
        {experiment.id && <ExperimentActions experiment={experiment} />}
      </Surface>
      {!experiment.id && <ExperimentMetadataTemplates form={form} />}
    </Form>
  );
};

const Details = () => {
  const { experiment_id } = useParams() as { experiment_id: string };
  const {
    data: fields,
    isLoading: isExperimentFieldsLoading,
    isError: isExperimentFieldsError,
    error: experimentFieldsError,
  } = useExperimentFields(undefined, undefined, {
    select: (d) => d.filter(({ name }) => name !== "publication_status_id"),
  });

  const { data, isLoading, isError, error } = useExperiment(experiment_id);

  if (isExperimentFieldsLoading || isLoading) return <Spinner />;
  if (isExperimentFieldsError || isError || !fields || !data)
    return <ErrorPage error={experimentFieldsError ?? error} />;
  return <ExperimentForm fields={fields} experiment={data} />;
};

export default Details;
