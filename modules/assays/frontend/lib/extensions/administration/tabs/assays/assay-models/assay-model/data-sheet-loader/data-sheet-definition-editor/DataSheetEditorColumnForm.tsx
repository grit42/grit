import { dataSheetColumnDefinitionSchema } from "./schema";
import {
  DATA_SHEET_COLUMN_FIELDS,
  DataSheetColumnDefinition,
} from "./dataSheetDefinitionEditorForm";
import {
  Button,
  ButtonGroup,
  Surface,
} from "@grit42/client-library/components";
import { useFormInputs } from "@grit42/form";
import z from "zod";

const DataSheetColumnForm = ({
  errorTree,
  onChange,
  onDone,
  onDelete,
  value,
}: {
  errorTree?: ReturnType<typeof z.treeifyError<z.infer<typeof dataSheetColumnDefinitionSchema>>>["properties"] | null;
  onChange: (fieldName: string, value: unknown) => void;
  onDone: () => void;
  onDelete: () => void;
  value: DataSheetColumnDefinition;
}) => {
  const inputs = useFormInputs();

  return (
    <Surface>
      {DATA_SHEET_COLUMN_FIELDS.map((fieldDef) => {
        const Input = inputs[fieldDef.type] ?? inputs["default"];
        return (
          <Input
            key={`column-field-${fieldDef.name}`}
            disabled={false}
            field={fieldDef}
            value={value[fieldDef.name as keyof DataSheetColumnDefinition]}
            error={
              errorTree
                ? Array.from(
                    new Set(
                      errorTree?.[
                        fieldDef.name as keyof DataSheetColumnDefinition
                      ]?.errors ?? [],
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
        <Button onClick={onDone}>Done</Button>
        <Button color="danger" onClick={onDelete}>
          Delete
        </Button>
      </ButtonGroup>
    </Surface>
  );
};

export default DataSheetColumnForm;
