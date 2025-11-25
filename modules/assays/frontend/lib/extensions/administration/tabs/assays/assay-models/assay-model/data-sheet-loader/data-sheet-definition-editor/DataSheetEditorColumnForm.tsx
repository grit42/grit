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
import { useEntityData } from "@grit42/core";

const DataSheetColumnForm = ({
  errorTree,
  onChange,
  onDone,
  onDelete,
  value,
}: {
  errorTree?:
    | ReturnType<
        typeof z.treeifyError<z.infer<typeof dataSheetColumnDefinitionSchema>>
      >["properties"]
    | null;
  onChange: (fieldName: string, value: unknown) => void;
  onDone: () => void;
  onDelete: () => void;
  value: DataSheetColumnDefinition;
}) => {
  const { data: units } = useEntityData("grit/core/units");
  const { data: dataTypes } = useEntityData("grit/core/data_types");

  const inputs = useFormInputs();

  return (
    <Surface
      style={{
        width: "100%",
        maxWidth: 960,
        marginInline: "auto",
        display: "grid",
        gridTemplateColumns: "1fr",
        gap: "var(--spacing)",
        gridAutoRows: "min-content",
      }}
    >
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
            handleBlur={() => void 0}
            handleChange={(value) => {
              if (fieldDef.name === "unit_id") {
                const unit = units?.find(({ id }) => id === value);
                onChange(fieldDef.name, value);
                onChange(`${fieldDef.name}__abbreviation`, unit?.abbreviation);
              } else if (fieldDef.name === "data_type_id") {
                const dataType = dataTypes?.find(({ id }) => id === value);
                onChange(fieldDef.name, value);
                onChange(`${fieldDef.name}__name`, dataType?.name);
              } else {
                onChange(fieldDef.name, value);
              }
            }}
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
