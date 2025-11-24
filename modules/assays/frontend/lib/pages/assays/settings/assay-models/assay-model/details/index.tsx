import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import {
  AssayModelData,
  useAssayModel,
  useAssayModelFields,
<<<<<<< HEAD:modules/assays/frontend/lib/extensions/administration/tabs/assays/assay-models/assay-model/details/index.tsx
} from "../../../../../../../queries/assay_models";
import { Link, useNavigate, useParams } from "react-router-dom";
=======
} from "../../../../../../queries/assay_models";
import { useNavigate, useParams } from "react-router-dom";
>>>>>>> a0be624 (Move assay administration to Assay header):modules/assays/frontend/lib/pages/assays/settings/assay-models/assay-model/details/index.tsx
import {
  Form,
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
} from "@grit42/core";
import { useState } from "react";
import styles from "../../assayModels.module.scss";

const AssayModelForm = ({
  fields,
  assayModel,
}: {
  fields: FormFieldDef[];
  assayModel: Partial<AssayModelData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AssayModelData>>(assayModel);

  const createEntityMutation = useCreateEntityMutation<AssayModelData>(
    "grit/assays/assay_models",
  );

  const editEntityMutation = useEditEntityMutation<AssayModelData>(
    "grit/assays/assay_models",
    assayModel.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_models",
  );

  const form = useForm<Partial<AssayModelData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AssayModelData>>(
        formValue,
        fields,
      );
      if (!assayModel.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as AssayModelData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/assay_models",
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
          await editEntityMutation.mutateAsync(value as AssayModelData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !assayModel.id ||
      !window.confirm(
        `Are you sure you want to delete this assay type? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(assayModel.id);
    navigate("../..");
  };

  return (
    <div className={styles.model}>
      <Surface className={styles.modelForm}>
        {!assayModel.id && (
          <h2 style={{ alignSelf: "baseline", marginBottom: ".5em" }}>
            New assay model
          </h2>
        )}
        <Form<Partial<AssayModelData>> form={form}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
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
            {fields.map((f) => (
              <FormField form={form} fieldDef={f} key={f.name} />
            ))}
          </div>
          <form.Subscribe
            selector={(state) => [
              state.canSubmit,
              state.isSubmitting,
              state.isDirty,
            ]}
            children={([canSubmit, isSubmitting, isDirty]) => {
              return (
                <ButtonGroup>
                  {isDirty && (
                    <Button
                      color="secondary"
                      disabled={!canSubmit}
                      type="submit"
                      loading={isSubmitting}
                    >
                      Save
                    </Button>
                  )}
                  {isDirty && (
                    <Button onClick={() => form.reset()}>Revert changes</Button>
                  )}
                  {!isDirty && (
                    <Button
                      onClick={() => navigate(assayModel.id ? "../.." : "..")}
                    >
                      {assayModel.id ? "Back" : "Cancel"}
                    </Button>
                  )}
                  {!isDirty && !!assayModel.id && (
                    <Link
                      to={{
                        pathname: "../clone",
                      }}
                    >
                      <Button>Clone</Button>
                    </Link>
                  )}
                  {!!assayModel.id && (
                    <Button
                      color="danger"
                      onClick={onDelete}
                      loading={destroyEntityMutation.isPending}
                    >
                      Delete
                    </Button>
                  )}
                </ButtonGroup>
              );
            }}
          />
        </Form>
      </Surface>
    </div>
  );
};

const Details = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const {
    data: fields,
    isLoading: isAssayModelFieldsLoading,
    isError: isAssayModelFieldsError,
    error: assayModelFieldsError,
  } = useAssayModelFields();

  const { data, isLoading, isError, error } = useAssayModel(assay_model_id);

  if (isAssayModelFieldsLoading || isLoading) return <Spinner />;
  if (isAssayModelFieldsError || isError || !fields || !data)
    return <ErrorPage error={assayModelFieldsError ?? error} />;
  return <AssayModelForm fields={fields} assayModel={data} />;
};

export default Details;
