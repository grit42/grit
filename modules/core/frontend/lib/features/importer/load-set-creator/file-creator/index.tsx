import { Surface } from "@grit42/client-library/components";
import { AddFormControl, Form, FormField, useForm } from "@grit42/form";
import { EditorInput } from "../../../../components";
import styles from "./fileCreator.module.scss";

export interface FileCreatorProps {
  onSubmit: (file: File) => void;
}

const FileCreator = ({ onSubmit }: FileCreatorProps) => {
  const form = useForm({
    defaultValues: {
      name: "",
      content: "",
    },
    onSubmit: async ({ value, formApi }) => {
      onSubmit(new File([value.content], value.name, {}));
      formApi.reset({ name: "", content: "" });
    },
  });

  const handleContentChange = async ({ fieldApi }: any) => {
    fieldApi.form.validateField("content", "submit");
  };

  return (
    <Surface className={styles.fileCreatorform}>
      <Form form={form} className={styles.fieldsContainer}>
        <h3>Create file manually</h3>
        <p>
          Enter data manually or paste from your clipboard, then click{" "}
          <strong>Add file</strong> below.
        </p>

        <FormField
          fieldDef={{
            name: "name",
            display_name: "File name",
            type: "string",
            required: true,
          }}
        />
        <form.Field
          name="content"
          listeners={{
            onChange: handleContentChange,
          }}
          children={(field) => (
            <EditorInput
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              value={field.state.value}
            />
          )}
        />
        <AddFormControl label="Add file" />
      </Form>
    </Surface>
  );
};

export default FileCreator;
