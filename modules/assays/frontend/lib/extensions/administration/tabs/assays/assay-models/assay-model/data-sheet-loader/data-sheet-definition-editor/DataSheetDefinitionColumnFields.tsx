import { Button, ButtonGroup, Surface } from "@grit42/client-library/components";
import { DATA_SHEET_COLUMN_FIELDS, DataSetDefinitionFull, defaultFormValues, withForm } from "./dataSheetDefinitionEditorForm";
import dataSetDefinitionSchema from "./schema";
import { DeepKeys } from "@tanstack/react-form";

export const FieldGroupColumnFields = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: dataSetDefinitionSchema,
    onMount: dataSetDefinitionSchema,
  },
  props: {
    sheetIndex: 0,
    columnIndex: 0,
    onDone: () => {},
    onDelete: () => {},
  },
  render: function Render({ form, sheetIndex, columnIndex, onDone, onDelete }) {
    return (
      <Surface>
        {DATA_SHEET_COLUMN_FIELDS.map((fieldDef) => (
          <form.AppField
            name={
              `sheets[${sheetIndex}].columns[${columnIndex}].${fieldDef.name}` as DeepKeys<DataSetDefinitionFull>
            }
            key={fieldDef.name}
          >
            {(field) => <field.DataSheetDefinitionEditorField fieldDef={fieldDef} />}
          </form.AppField>
        ))}
        <ButtonGroup>
          <Button onClick={onDone}>Done</Button>
          <Button color="danger" onClick={onDelete}>
            Delete
          </Button>
        </ButtonGroup>
      </Surface>
    );
  },
});

export const FieldGroupHiddenColumnFields = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: dataSetDefinitionSchema,
    onMount: dataSetDefinitionSchema,
  },
  props: {
    sheetIndex: 0,
    columnIndex: 0,
  },
  render: function Render({ form, sheetIndex, columnIndex }) {
    return DATA_SHEET_COLUMN_FIELDS.map((fieldDef) => (
      <form.AppField
        name={
          `sheets[${sheetIndex}].columns[${columnIndex}].${fieldDef.name}` as DeepKeys<DataSetDefinitionFull>
        }
        key={fieldDef.name}
      >
        {() => null}
      </form.AppField>
    ));
  },
});
