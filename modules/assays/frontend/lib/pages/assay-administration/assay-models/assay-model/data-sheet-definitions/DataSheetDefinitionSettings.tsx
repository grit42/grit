import { useQueryClient } from "@grit42/api";
import {
  Button,
  ErrorPage,
  LoadingPage,
  useConfirm,
} from "@grit42/client-library/components";
import {
  FormPage,
  useDangerousDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit42/core";
import {
  Form,
  FormBanner,
  FormControls,
  FormField,
  FormFields,
  genericErrorHandler,
  useForm,
} from "@grit42/form";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AssayDataSheetDefinitionData,
  useAssayDataSheetDefinition,
} from "../../../../../queries/assay_data_sheet_definitions";
import { useCallback } from "react";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";

const DataSheetDefinitionSettingsForm = ({
  dataSheetDefinition,
}: {
  dataSheetDefinition: Partial<AssayDataSheetDefinitionData>;
}) => {
  const { dangerousEditMode, canEdit } = useAssayModelEditorContext();
  const queryClient = useQueryClient();
  const editEntityMutation = useEditEntityMutation(
    "grit/assays/assay_data_sheet_definitions",
    dataSheetDefinition.id!,
  );

  const form = useForm({
    defaultValues: dataSheetDefinition,
    onSubmit: genericErrorHandler(async ({ value, formApi }) => {
      const updatedEntity = await editEntityMutation.mutateAsync({
        ...value,
        dangerous_edit: dangerousEditMode ?? undefined,
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "data",
            "grit/assays/assay_data_sheet_definitions",
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "datum",
            "grit/assays/assay_data_sheet_definitions",
            updatedEntity.id.toString(),
          ],
        }),
      ]);
      formApi.reset(updatedEntity);
    }),
  });

  return (
    <Form form={form}>
      <FormFields columns={1}>
        <FormBanner content={form.state.errorMap.onSubmit} />
        <FormField
          fieldDef={{
            name: "name",
            display_name: "Name",
            type: "string",
            disabled: !canEdit,
          }}
        />
        <FormField
          fieldDef={{
            name: "description",
            display_name: "Description",
            type: "text",
            disabled: !canEdit,
          }}
        />
        <FormField
          fieldDef={{
            name: "result",
            display_name: "Result",
            type: "boolean",
            disabled: !canEdit,
          }}
        />
      </FormFields>
      <FormControls />
    </Form>
  );
};

const DeleteDataSheetDefinition = ({
  dataSheetDefinition,
}: {
  dataSheetDefinition: Partial<AssayDataSheetDefinitionData>;
}) => {
  const confirm = useConfirm();
  const { dangerousEditMode } = useAssayModelEditorContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyEntityMutation = useDangerousDestroyEntityMutation(
    "grit/assays/assay_data_sheet_definitions",
  );

  const handleDelete = useCallback(async () => {
    const confirmed = await confirm({
      title: `Delete data sheet ${dataSheetDefinition.name}?`,
      body: `Are you sure you want to delete this data sheet? This action is irreversible`,
      challenge: dangerousEditMode ? dataSheetDefinition.name : undefined,
      danger: true,
    });
    if (!confirmed) {
      return;
    }
    await destroyEntityMutation.mutateAsync([
      dataSheetDefinition.id,
      dangerousEditMode,
    ]);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "datum",
          "grit/assays/assay_data_sheet_definitions",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/assay_data_sheet_definitions",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          "grit/assays/assay_data_sheet_definitions",
        ],
      }),
    ]);
    navigate("../..", { relative: "path" });
  }, [
    confirm,
    dataSheetDefinition.name,
    dataSheetDefinition.id,
    dangerousEditMode,
    destroyEntityMutation,
    queryClient,
    navigate,
  ]);

  return (
    <FormPage.Action
      title="Delete data sheet definition"
      actionLabel="Delete"
      onAction={handleDelete}
    >
      <p>
        <b>This action is irreversible.</b>
      </p>
    </FormPage.Action>
  );
};

const CloneDataSheetDefinition = () => {
  return (
    <FormPage.Action
      title="Clone data sheet definition"
      action={
        <Link to="../clone">
          <Button>Clone</Button>
        </Link>
      }
    >
      Create a copy of this data sheet.
    </FormPage.Action>
  );
};

const DataSheetDefinitionSettingsPage = () => {
  const { canEdit } = useAssayModelEditorContext();
  const { data_sheet_definition_id } = useParams() as {
    data_sheet_definition_id: string;
  };
  const data = useAssayDataSheetDefinition(data_sheet_definition_id);

  if (data.isLoading) {
    return <LoadingPage />;
  }

  if (data.isError || !data.data) {
    return (
      <ErrorPage error={data.error}>
        <Link to=".." relative="path">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <FormPage>
      <FormPage.Body>
        <DataSheetDefinitionSettingsForm dataSheetDefinition={data.data} />
        {canEdit && (
          <>
            <CloneDataSheetDefinition />
            <DeleteDataSheetDefinition dataSheetDefinition={data.data} />
          </>
        )}
      </FormPage.Body>
    </FormPage>
  );
};

export default DataSheetDefinitionSettingsPage;
