import { FormFieldDef, useFormInput } from "@grit42/form";
import { useFieldContext } from "./formContexts";

function DataSheetDefinitionEditorField({ fieldDef }: { fieldDef: FormFieldDef }) {
  const Input = useFormInput(fieldDef.type);
  const field = useFieldContext<string>();

  return (
    <Input
      field={fieldDef}
      disabled={false}
      error={Array.from(
        new Set(field.state.meta.errors.map(({ message }) => message)),
      ).join("\n")}
      handleChange={field.handleChange}
      handleBlur={field.handleBlur}
      value={field.state.value}
    />
  );
}

export default DataSheetDefinitionEditorField;
