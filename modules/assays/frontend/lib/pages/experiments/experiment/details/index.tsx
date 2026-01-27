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
import { useQueryClient } from "@grit42/api";
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
  publication_status_id_field?: FormFieldDef;
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
    assay_model_id_field,
    name_field,
    description_field,
    publication_status_id_field,
  } = useMemo(() => {
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
      name_field: fields.find(({ name }) => name === "name"),
      description_field: fields.find(({ name }) => name === "description"),
      publication_status_id_field: fields.find(
        ({ name }) => name === "publication_status_id",
      ),
    } satisfies ExperimentFormFields;
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
            <FormField form={form} fieldDef={publication_status_id_field} />
          </div>
          <div className={styles.formFullwidthField}>
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
  } = useExperimentFields();

  const { data, isLoading, isError, error } = useExperiment(experiment_id);

  if (isExperimentFieldsLoading || isLoading) return <Spinner />;
  if (isExperimentFieldsError || isError || !fields || !data)
    return <ErrorPage error={experimentFieldsError ?? error} />;
  return <ExperimentForm fields={fields} experiment={data} />;
};

export default Details;
