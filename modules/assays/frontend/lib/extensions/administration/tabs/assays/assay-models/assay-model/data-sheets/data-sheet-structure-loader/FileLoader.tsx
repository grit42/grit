import {
  AddFormControl,
  Form,
  FormField,
  FormFieldDef,
  useForm,
} from "@grit42/form";
import { Button, Surface } from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";

const FileLoader = ({
  files,
  setFiles,
}: {
  files: File[];
  setFiles: (files: File[]) => void;
}) => {
  const navigate = useNavigate();
  const form = useForm<{ files: File[] }>({
    defaultValues: { files },
    onSubmit: ({ value }) => {
      setFiles(value.files);
      navigate("../edit");
    },
  });

  return (
    <Surface>
      <h2 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        Import structure
      </h2>
      <Form<{ files: File[] }> form={form}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
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
          <FormField
            form={form}
            fieldDef={
              {
                display_name: "Files",
                name: "files",
                type: "binary",
                required: true,
                multiple: true,
              } as FormFieldDef
            }
          />
        </div>
        <AddFormControl form={form} label="Load">
          <Button onClick={() => navigate("../..")}>Cancel</Button>
        </AddFormControl>
      </Form>
    </Surface>
  );
};

export default FileLoader;
