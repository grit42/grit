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
import { useMemo, useState } from "react";
import { toSafeIdentifier } from "@grit42/core/utils";
import styles from "../dataSheetStructureLoader.module.scss";

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
  const [hasNameChanged, setHasNameChanged] = useState(false);
  const { data: units } = useEntityData("grit/core/units");
  const { data: dataTypes } = useEntityData("grit/core/data_types");

  const inputs = useFormInputs();

  const { safe_name, proposed_safe_name } = useMemo(() => {
    const { name, safe_name } = value;
    const proposed_safe_name = toSafeIdentifier(name as string);
    return { safe_name, proposed_safe_name } as {
      safe_name: string;
      proposed_safe_name: string;
    };
  }, [value]);

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
        overflowY: "auto",
      }}
    >
      {DATA_SHEET_COLUMN_FIELDS.map((fieldDef) => {
        const Input = inputs[fieldDef.type] ?? inputs["default"];
        return (
          <>
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
                if (fieldDef.name === "name") {
                  setHasNameChanged(true);
                }
                if (fieldDef.name === "unit_id") {
                  const unit = units?.find(({ id }) => id === value);
                  onChange(fieldDef.name, value);
                  onChange(
                    `${fieldDef.name}__abbreviation`,
                    unit?.abbreviation,
                  );
                } else if (fieldDef.name === "data_type_id") {
                  const dataType = dataTypes?.find(({ id }) => id === value);
                  onChange(fieldDef.name, value);
                  onChange(`${fieldDef.name}__name`, dataType?.name);
                } else {
                  onChange(fieldDef.name, value);
                }
              }}
            />
            {fieldDef.name === "safe_name" &&
              safe_name !== proposed_safe_name &&
              proposed_safe_name.length &&
              hasNameChanged && (
                <div className={styles.columnFormFieldSuggestion}>
                  <em
                    role="button"
                    onClick={() => onChange("safe_name", proposed_safe_name)}
                  >
                    Use "{proposed_safe_name}"
                  </em>
                </div>
              )}
          </>
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
