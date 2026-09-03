import { useQueryClient } from "@grit42/api";
import { Button, Surface } from "@grit42/client-library/components";
import { useCreateEntityMutation } from "@grit42/core";
import {
  Form,
  FormBanner,
  FormControls,
  FormField,
  FormFieldDef,
  FormFields,
  genericErrorHandler,
  useForm,
} from "@grit42/form";
import { Link, useNavigate } from "react-router-dom";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";
import styles from "./dataSheetDefinition.module.scss";

const FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
  },
  {
    name: "description",
    display_name: "Description",
    type: "text",
  },
  {
    name: "result",
    display_name: "Result",
    type: "boolean",
  },
  {
    name: "sort",
    display_name: "Sort",
    type: "integer",
  },
];

const NewDataSheetDefinitionPage = () => {
  const { assayModel } = useAssayModelEditorContext();
  const { dangerousEditMode } = useAssayModelEditorContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createEntityMutation = useCreateEntityMutation(
    "grit/assays/assay_data_sheet_definitions",
  );

  const form = useForm({
    defaultValues: {},
    onSubmit: genericErrorHandler(async ({ value }) => {
      const newEntity = await createEntityMutation.mutateAsync({
        ...value,
        assay_model_id: assayModel.id,
        dangerous_edit: dangerousEditMode ?? undefined,
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/assay_data_sheet_definitions",
        ],
      });
      navigate(`../${newEntity.id.toString()}`, {
        relative: "path",
      });
    }),
  });

  return (
    <div className={styles.newDataSheetDefinitionPage}>
      <div className={styles.header}>
        <h1>New data sheet</h1>
      </div>
      <Surface>
        <Form form={form}>
          <FormFields columns={1}>
            <FormBanner content={form.state.errorMap.onSubmit} />
            {FIELDS.map((f) => (
              <FormField fieldDef={f} key={f.name} />
            ))}
          </FormFields>
          <FormControls>
            <Link to=".." relative="path">
              <Button color="primary">Cancel</Button>
            </Link>
          </FormControls>
        </Form>
      </Surface>
    </div>
  );
};

export default NewDataSheetDefinitionPage;
