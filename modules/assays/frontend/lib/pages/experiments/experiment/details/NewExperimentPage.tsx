import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Form,
  FormBanner,
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
  EntityFormFieldDef,
  useHasPermission,
  useBreadcrumbs,
} from "@grit42/core";
import { useMemo, useState } from "react";
import styles from "./details.module.scss";
import {
  ExperimentData,
  useExperimentFields,
} from "../../../../queries/experiments";
import { classnames } from "@grit42/client-library/utils";
import ExperimentMetadataForm from "./ExperimentMetadataForm";
import ExperimentMetadataTemplates from "./ExperimentMetadataTemplates";
import { EXPERIMENTS_BREADCRUMBS } from "../../breadcrumbs";

type ExperimentFormFields = {
  assay_model_id_field?: FormFieldDef;
  name_field?: FormFieldDef;
  description_field?: FormFieldDef;
};

const ExperimentForm = ({
  fields,
  experiment,
}: {
  fields: FormFieldDef[];
  experiment: Partial<ExperimentData>;
}) => {
  const canCrudExperiment =
    useHasPermission("write:assays") &&
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

  const form = useForm({
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
        <Link to="../..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <Form
      form={form}
      className={classnames(styles.container, {
        [styles.withMetadataTemplates]: !experiment.id,
      })}
    >
      <Surface className={styles.form}>
        {!experiment.id && <h2 className={styles.formTitle}>New experiment</h2>}
        <div className={styles.formFields}>
          <FormBanner content={form.state.errorMap.onSubmit} />
          <div className={styles.formFullwidthField}>
            <FormField fieldDef={assay_model_id_field} />
          </div>
          <div className={styles.formFullwidthField}>
            <FormField fieldDef={name_field} />
          </div>
          <div className={styles.formFullwidthField}>
            <FormField fieldDef={description_field} />
          </div>
          <ExperimentMetadataForm
            form={form as any}
            disabled={!canCrudExperiment}
          />
        </div>
        <FormControls
          showCancel
          cancelLabel={experiment.id ? "Back" : "Cancel"}
          onCancel={() => navigate(experiment.id ? "../../.." : "../..")}
        />
      </Surface>
      {!experiment.id && <ExperimentMetadataTemplates form={form as any} />}
    </Form>
  );
};

const NewExperimentPage = () => {
  useBreadcrumbs(EXPERIMENTS_BREADCRUMBS);

  const {
    data: fields,
    isLoading: isExperimentFieldsLoading,
    isError: isExperimentFieldsError,
    error: experimentFieldsError,
  } = useExperimentFields(undefined, undefined, {
    select: (d) => d.filter(({ name }) => name !== "publication_status_id"),
  });

  if (isExperimentFieldsLoading) return <Spinner />;
  if (isExperimentFieldsError || !fields)
    return <ErrorPage error={experimentFieldsError} />;
  return <ExperimentForm fields={fields} experiment={{}} />;
};

export default NewExperimentPage;
