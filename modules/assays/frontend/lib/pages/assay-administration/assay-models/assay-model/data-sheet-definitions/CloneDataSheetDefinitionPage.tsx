import { useQueryClient } from "@grit42/api";
import {
  Button,
  ErrorPage,
  LoadingPage,
  Surface,
} from "@grit42/client-library/components";
import { useCreateEntityMutation } from "@grit42/core";
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
import { useAssayModelEditorContext } from "../AssayModelEditorContext";

const CloneDataSheetDefinitionForm = ({
  dataSheetDefinition,
}: {
  dataSheetDefinition: Partial<AssayDataSheetDefinitionData>;
}) => {
  const { dangerousEditMode } = useAssayModelEditorContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createEntityMutation = useCreateEntityMutation(
    `grit/assays/assay_data_sheet_definitions/${dataSheetDefinition.id!}/clone`,
  );

  const form = useForm({
    defaultValues: dataSheetDefinition,
    onSubmit: genericErrorHandler(async ({ value }) => {
      const newEntity = await createEntityMutation.mutateAsync({
        ...value,
        dangerous_edit: dangerousEditMode ?? undefined,
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/assay_data_sheet_definitions",
        ],
      });
      navigate(`../../${newEntity.id.toString()}`, {
        relative: "path",
      });
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
          }}
        />
        <FormField
          fieldDef={{
            name: "description",
            display_name: "Description",
            type: "text",
          }}
        />
        <FormField
          fieldDef={{
            name: "result",
            display_name: "Result",
            type: "boolean",
          }}
        />
      </FormFields>
      <FormControls>
        <Link to="../settings" relative="path">
          <Button color="primary">Cancel</Button>
        </Link>
      </FormControls>
    </Form>
  );
};

const CloneDataSheetDefinitionPage = () => {
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
    <div className={styles.newDataSheetDefinitionPage}>
      <div className={styles.header}>
        <h1>Clone data sheet</h1>
      </div>
      <Surface>
        <CloneDataSheetDefinitionForm dataSheetDefinition={data.data} />
      </Surface>
    </div>
  );
};

export default CloneDataSheetDefinitionPage;
