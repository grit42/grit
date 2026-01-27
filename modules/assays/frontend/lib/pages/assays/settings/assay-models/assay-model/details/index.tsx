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
} from "../../../../../../queries/assay_models";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Form,
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
} from "@grit42/core";
import { useState } from "react";
import styles from "../../assayModels.module.scss";

export const usePublishAssayModelMutation = (
  id: string | number,
  mutationOptions: UseMutationOptions<
    AssayModelData,
    EndpointErrorErrors<AssayModelData>
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["publishAssayModel", id.toString()],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<AssayModelData>,
        EndpointError<EndpointErrorErrors<AssayModelData>>
      >(`grit/assays/assay_models/${id}/publish`, {
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
            "grit/assays/assay_models",
            id.toString(),
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/assays/assay_models"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/assays/assay_models"],
          refetchType: "all",
        }),
      ]);
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};

export const useDraftAssayModelMutation = (
  id: string | number,
  mutationOptions: UseMutationOptions<
    AssayModelData,
    EndpointErrorErrors<AssayModelData>
  > = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["draftAssayModel", id.toString()],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess<AssayModelData>,
        EndpointError<EndpointErrorErrors<AssayModelData>>
      >(`grit/assays/assay_models/${id}/draft`, {
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
            "grit/assays/assay_models",
            id.toString(),
          ],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", "grit/assays/assay_models"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", "grit/assays/assay_models"],
          refetchType: "all",
        }),
      ]);
    },
    onError: notifyOnError,
    ...mutationOptions,
  });
};

const AssayModelActions = ({
  assayModel,
}: {
  assayModel: Partial<AssayModelData>;
}) => {
  const navigate = useNavigate();
  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_models",
  );

  const publishMutation = usePublishAssayModelMutation(assayModel.id!);
  const draftMutation = useDraftAssayModelMutation(assayModel.id!);

  const onDelete = async () => {
    if (
      !assayModel.id ||
      !window.confirm(
        `Are you sure you want to delete this assay model? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(assayModel.id);
    navigate("../..");
  };

  const onPublish = async () => {
    if (!assayModel.id) {
      return;
    }
    await publishMutation.mutateAsync();
  };

  const onDraft = async () => {
    if (!assayModel.id) {
      return;
    }
    await draftMutation.mutateAsync();
  };

  if (!assayModel.id) {
    return null;
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
      }}
    >
      {assayModel.publication_status_id__name === "Draft" && (
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
            <h3>Publish this Assay Model</h3>
            <p>
              Publishing this Assay Model will make it available for creating
              Experiments and for use in Data Tables.
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
      {assayModel.publication_status_id__name === "Published" && (
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
            width: "80ch"
            }}
          >
            <h3>Convert this Assay Model to Draft</h3>
            <p>
              Converting this Assay Model to draft will allow you to make changes to its
              Metadata and Data Sheets. However, all related experiments and
              existing data will be permanently deleted.{" "}
              <b>This data cannot be recovered.</b>
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
            width: "80ch"
          }}
        >
          <h3>Delete this Assay Model</h3>
          <p>
            Deleting this Assay Model will permanently remove all related
            experiments and existing data. <b>This action is irreversible.</b>
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

const AssayModelForm = ({
  fields: fieldsFromProps,
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

  const fields = fieldsFromProps.map((f) => ({...f, disabled: assayModel.publication_status_id__name === "Published"}))

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
                </ButtonGroup>
              );
            }}
          />
        </Form>
        <AssayModelActions assayModel={assayModel} />
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
  } = useAssayModelFields(undefined, {
    select: (data) =>
      data.filter(({ name }) => name !== "publication_status_id"),
  });

  const { data, isLoading, isError, error } = useAssayModel(assay_model_id);

  if (isAssayModelFieldsLoading || isLoading) return <Spinner />;
  if (isAssayModelFieldsError || isError || !fields || !data)
    return <ErrorPage error={assayModelFieldsError ?? error} />;
  return <AssayModelForm fields={fields} assayModel={data} />;
};

export default Details;
