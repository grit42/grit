import { dataSheetDefinitionSchema } from "./schema";
import {
  DATA_SHEET_FIELDS,
  DataSheetDefinition,
} from "./dataSheetDefinitionEditorForm";
import {
  Button,
  ButtonGroup,
  Surface,
} from "@grit42/client-library/components";
import { useFormInputs } from "@grit42/form";
import z from "zod";

const DataSheetForm = ({
  errorTree,
  onChange,
  onDelete,
  value,
}: {
  errorTree?:
    | ReturnType<
        typeof z.treeifyError<z.infer<typeof dataSheetDefinitionSchema>>
      >["properties"]
    | null;
  onChange: (fieldName: string, value: unknown) => void;
  onDelete: () => void;
  value: DataSheetDefinition;
}) => {
  const inputs = useFormInputs();

  return (
    <Surface
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        gridAutoRows: "min-content",
        maxWidth: "40ch",
        gap: "var(--spacing)",
      }}
    >
      {DATA_SHEET_FIELDS.map((fieldDef) => {
        const Input = inputs[fieldDef.type] ?? inputs["default"];
        return (
          <Input
            key={`sheet-field-${fieldDef.name}`}
            disabled={false}
            field={fieldDef}
            value={value[fieldDef.name as keyof DataSheetDefinition]}
            error={
              errorTree
                ? Array.from(
                    new Set(
                      errorTree?.[fieldDef.name as keyof DataSheetDefinition]
                        ?.errors ?? [],
                    ),
                  ).join("\n")
                : ""
            }
            handleBlur={() => {}}
            handleChange={(value) => onChange(fieldDef.name, value)}
          />
        );
      })}
      <ButtonGroup>
        <Button color="danger" onClick={onDelete}>
          Delete
        </Button>
      </ButtonGroup>
    </Surface>
  );
};

export default DataSheetForm;
