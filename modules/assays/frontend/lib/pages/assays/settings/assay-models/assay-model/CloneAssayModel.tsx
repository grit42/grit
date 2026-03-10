import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { useNavigate, useParams } from "react-router-dom";
import {
  Form,
  FormBanner,
  FormControls,
  FormField,
  FormFieldDef,
  FormFields,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import { useQueryClient } from "@grit42/api";
import {
  PublicationStatus,
  useCreateEntityMutation,
  usePublicationStatuses,
} from "@grit42/core";
import { useState } from "react";
import {
  AssayModelData,
  useAssayModel,
  useAssayModelFields,
} from "../../../../../queries/assay_models";
import { CenteredSurface } from "@grit42/client-library/layouts";

const AssayModelForm = ({
  fields,
  assayModel,
  publicationStatuses,
}: {
  fields: FormFieldDef[];
  assayModel: Partial<AssayModelData>;
  publicationStatuses: PublicationStatus[];
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AssayModelData>>(assayModel);

  const createEntityMutation = useCreateEntityMutation<AssayModelData>(
    `grit/assays/assay_models/${assayModel.id}/clone`,
  );

  const form = useForm({
    defaultValues: {
      ...formData,
      publication_status_id: publicationStatuses.find(
        ({ name }) => name === "Draft",
      )?.id,
    },
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AssayModelData>>(
        formValue,
        fields,
      );

      const newEntity = await createEntityMutation.mutateAsync({
        ...value,
      } as AssayModelData);

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
      navigate(`../../${newEntity.id}/details`, {
        relative: "path",
        replace: true,
      });
    }),
  });

  return (
    <CenteredSurface>
      <h2>Clone assay model</h2>
      <Form form={form}>
        <FormFields columns={1}>
          <FormBanner content={form.state.errorMap.onSubmit} />
          {fields.map((f) => (
            <FormField fieldDef={f} key={f.name} />
          ))}
        </FormFields>
        <FormControls
          showCancel
          cancelLabel={"Cancel"}
          onCancel={() => navigate("..")}
        />
      </Form>
    </CenteredSurface>
  );
};

const CloneAssayModel = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const {
    data: fields,
    isLoading: isAssayModelFieldsLoading,
    isError: isAssayModelFieldsError,
    error: assayModelFieldsError,
  } = useAssayModelFields();

  const { data, isLoading, isError, error } = useAssayModel(assay_model_id);
  const {
    data: publicationStatuses,
    isLoading: isPublicationStatusesLoading,
    isError: isPublicationStatusesError,
    error: publicationStatusesError,
  } = usePublicationStatuses();

  if (isAssayModelFieldsLoading || isLoading || isPublicationStatusesLoading)
    return <Spinner />;
  if (
    isAssayModelFieldsError ||
    isError ||
    isPublicationStatusesError ||
    !fields ||
    !data ||
    !publicationStatuses
  )
    return (
      <ErrorPage
        error={assayModelFieldsError ?? publicationStatusesError ?? error}
      />
    );
  return (
    <AssayModelForm
      fields={fields}
      assayModel={data}
      publicationStatuses={publicationStatuses}
    />
  );
};

export default CloneAssayModel;
