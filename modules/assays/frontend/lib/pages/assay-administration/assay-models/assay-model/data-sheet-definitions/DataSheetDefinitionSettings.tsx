import { useQueryClient } from "@grit42/api";
import {
  Button,
  ErrorPage,
  LoadingPage,
  Surface,
} from "@grit42/client-library/components";
import { useDestroyEntityMutation, useEditEntityMutation } from "@grit42/core";
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
import styles from "./dataSheetDefinition.module.scss";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_data_sheet_definitions",
  );

  const handleDelete = useCallback(async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${dataSheetDefinition.name}? This action is irreversible`,
      )
    ) {
      return;
    }

    await destroyEntityMutation.mutateAsync(dataSheetDefinition.id);
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
    dataSheetDefinition.name,
    dataSheetDefinition.id,
    destroyEntityMutation,
    queryClient,
    navigate,
  ]);

  return (
    <>
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Delete data sheet definition</h3>
          <p>
            <b>This action is irreversible.</b>
          </p>
        </div>
        <Button onClick={handleDelete} color="danger">
          Delete
        </Button>
      </div>
    </>
  );
};

const CloneDataSheetDefinition = () => {
  return (
    <>
      <div className={styles.actionSection}>
        <div className={styles.actionContent}>
          <h3>Clone data sheet definition</h3>
          <p>Create a copy of this data sheet.</p>
        </div>
        <Link to="../clone">
          <Button>Clone</Button>
        </Link>
      </div>
    </>
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
    <Surface className={styles.settings}>
      <DataSheetDefinitionSettingsForm dataSheetDefinition={data.data} />
      {canEdit && (
        <>
          <DeleteDataSheetDefinition dataSheetDefinition={data.data} />
          <CloneDataSheetDefinition />
        </>
      )}
    </Surface>
  );
};

export default DataSheetDefinitionSettingsPage;
