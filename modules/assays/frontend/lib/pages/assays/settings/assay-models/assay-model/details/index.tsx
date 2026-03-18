import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  useConfirm,
} from "@grit42/client-library/components";
import {
  AssayModelData,
  useAssayModel,
  useAssayModelFields,
} from "../../../../../../queries/assay_models";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Form,
  FormBanner,
  FormField,
  FormFieldDef,
  FormFields,
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
  useDangerousDestroyEntityMutation,
} from "@grit42/core";
import { useState } from "react";
import styles from "./details.module.scss";
import { CenteredSurface } from "@grit42/client-library/layouts";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";

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

const AssayModelAction = ({
  title,
  description,
  action,
}: {
  title: string;
  description: React.ReactNode;
  action: React.ReactNode;
}) => (
  <div className={styles.actionSection}>
    <div className={styles.actionContent}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
    {action}
  </div>
);

const AssayModelActions = ({
  assayModel,
}: {
  assayModel: Partial<AssayModelData>;
}) => {
  const confirm = useConfirm();
  const { dangerousEditMode, setDangerousEditMode, published } =
    useAssayModelEditorContext();
  const navigate = useNavigate();
  const destroyEntityMutation = useDangerousDestroyEntityMutation(
    "grit/assays/assay_models",
  );

  const publishMutation = usePublishAssayModelMutation(assayModel.id!);
  const draftMutation = useDraftAssayModelMutation(assayModel.id!);

  const onDelete = async () => {
    const confirmed = await confirm({
      title: `Delete assay model ${assayModel.name}?`,
      body: `Are you sure you want to delete this assay model? All related experiments and data will be permanently deleted.`,
      challenge: published ? assayModel.name : undefined,
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    await destroyEntityMutation.mutateAsync([assayModel.id, dangerousEditMode]);
    navigate("../..", { relative: "path" });
  };

  const onPublish = async () => {
    if (!assayModel.id) {
      return;
    }
    await publishMutation.mutateAsync();
  };

  const onDraft = async () => {
    const confirmed = await confirm({
      title: `Convert assay model ${assayModel.name} to draft?`,
      body: `Are you sure you want to convert this Assay Model to draft? All related experiments and data will be permanently deleted.`,
      challenge: assayModel.name,
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    await draftMutation.mutateAsync();
  };

  const onDangerousEditMode = async () => {
    const confirmed = await confirm({
      title: `Dangerously edit ${assayModel.name}?`,
      body: `Are you sure you want to enter dangerous edit mode? Changes made in this mode can cause permanent data loss.`,
      challenge: assayModel.name,
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    setDangerousEditMode(true);
  };

  if (!assayModel.id) {
    return null;
  }

  return (
    <>
      {assayModel.publication_status_id__name === "Published" &&
        !dangerousEditMode && (
          <AssayModelAction
            title="Enter dangerous edit mode"
            description={
              <>
                The dangerous edit mode enables modifying a published assay
                model, potentially causing permanent data loss if not used
                carefully. Use this only if you are absolutely sure of what you
                are doing.{" "}
                <b>
                  The data lost when deleting sheets or columns cannot be
                  recovered.
                </b>
              </>
            }
            action={
              <Button color="danger" onClick={onDangerousEditMode}>
                Dangerous edit mode
              </Button>
            }
          />
        )}

      {assayModel.publication_status_id__name === "Draft" && (
        <AssayModelAction
          title="Publish this Assay Model"
          description="Publishing this Assay Model will make it available for creating Experiments and for use in Data Tables."
          action={
            <Button
              color="secondary"
              onClick={onPublish}
              loading={publishMutation.isPending}
            >
              Publish
            </Button>
          }
        />
      )}
      {assayModel.publication_status_id__name === "Published" && (
        <AssayModelAction
          title="Convert this Assay Model to Draft"
          description={
            <>
              Converting this Assay Model to draft will allow you to make
              changes to its Metadata and Data Sheets. However, all related
              experiments and existing data will be permanently deleted.{" "}
              <b>This data cannot be recovered.</b>
            </>
          }
          action={
            <Button
              color="danger"
              onClick={onDraft}
              loading={draftMutation.isPending}
            >
              Convert to Draft
            </Button>
          }
        />
      )}
      <AssayModelAction
        title="Delete this Assay Model"
        description={
          <>
            Deleting this Assay Model will permanently remove all related
            experiments and existing data. <b>This action is irreversible.</b>
          </>
        }
        action={
          <Button
            color="danger"
            onClick={onDelete}
            loading={destroyEntityMutation.isPending}
          >
            Delete
          </Button>
        }
      />
    </>
  );
};

const AssayModelForm = ({
  fields: fieldsFromProps,
  assayModel,
}: {
  fields: FormFieldDef[];
  assayModel: Partial<AssayModelData>;
}) => {
  const { canEdit, dangerousEditMode } = useAssayModelEditorContext();
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

  const fields = fieldsFromProps.map((f) => ({
    ...f,
    disabled: !canEdit,
  }));

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = {
        ...getVisibleFieldData<Partial<AssayModelData>>(formValue, fields),
        dangerous_edit: dangerousEditMode ?? undefined,
      };
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
    <CenteredSurface>
      {!assayModel.id && <h2>New assay model</h2>}
      <Form form={form}>
        <FormFields columns={1}>
          <FormBanner content={form.state.errorMap.onSubmit} />
          {fields.map((f) => (
            <FormField fieldDef={f} key={f.name} />
          ))}
        </FormFields>
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
                    onClick={() =>
                      navigate(assayModel.id ? "../../.." : "../..", {
                        relative: "path",
                      })
                    }
                  >
                    {assayModel.id ? "Back" : "Cancel"}
                  </Button>
                )}
                {!isDirty && !!assayModel.id && (
                  <Link to="../clone" relative="path">
                    <Button>Clone</Button>
                  </Link>
                )}
              </ButtonGroup>
            );
          }}
        />
      </Form>
      {assayModel.id && <AssayModelActions assayModel={assayModel} />}
    </CenteredSurface>
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
