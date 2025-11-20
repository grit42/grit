import { DATA_SHEET_FIELDS, DataSetDefinitionFull, DataSheetColumnDefinition, defaultFormValues, withForm } from "./dataSheetDefinitionEditorForm";
import dataSetDefinitionSchema from "./schema";
import { Button, ButtonGroup, Surface } from "@grit42/client-library/components";
import { DeepKeys } from "@tanstack/react-form";
import { useTableColumns } from "@grit42/core/utils";
import { Table, useSetupTableState } from "@grit42/table";
import styles from "../dataSheetStructureLoader.module.scss";
import { FieldGroupColumnFields, FieldGroupHiddenColumnFields } from "./DataSheetDefinitionColumnFields";
import { EntityData } from "@grit42/core";

const DATA_SHEET_COLUMN_COLUMNS = [
  {
    name: "name",
    display_name: "Name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
    unique: false,
    default_hidden: false,
  },
  {
    name: "safe_name",
    display_name: "Safe name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
    unique: true,
    default_hidden: false,
  },
  {
    name: "description",
    display_name: "Description",
    description: "",
    type: "text",
    limit: undefined,
    required: false,
    unique: false,
    default_hidden: false,
  },
  {
    name: "sort",
    display_name: "Sort",
    description: "",
    type: "integer",
    limit: 4,
    required: false,
    unique: false,
    default_hidden: false,
  },
  {
    name: "required",
    display_name: "Required",
    description: "",
    type: "boolean",
    limit: undefined,
    required: true,
    unique: false,
    default_hidden: false,
  },
  {
    name: "data_type_id__name",
    display_name: "Data type",
    description: "",
    type: "entity",
    limit: 8,
    required: true,
    unique: false,
    entity: {
      full_name: "Grit::Core::DataType",
      name: "DataType",
      path: "grit/core/data_types",
      primary_key: "id",
      primary_key_type: "integer",
      column: "data_type_id",
      display_column: "name",
      display_column_type: "string",
    },
    default_hidden: false,
  },
  {
    name: "unit_id__abbreviation",
    display_name: "Unit",
    description: "",
    type: "entity",
    limit: 8,
    required: false,
    unique: false,
    entity: {
      full_name: "Grit::Core::Unit",
      name: "Unit",
      path: "grit/core/units",
      primary_key: "id",
      primary_key_type: "integer",
      column: "unit_id",
      display_column: "abbreviation",
      display_column_type: "string",
    },
    default_hidden: false,
  },
];

function SheetColumnsTable({
  columns,
  setFocusedColumnId,
}: {
  columns: DataSheetColumnDefinition[];
  setFocusedColumnId: (id: number) => void;
}) {
  const tableColumns = useTableColumns(DATA_SHEET_COLUMN_COLUMNS ?? []);

  const tableState = useSetupTableState("sheet-columns", tableColumns, {
    saveState: {
      columnSizing: true,
    },
  });

  return (
    <Table
      header="Columns"
      tableState={tableState}
      className={styles.typesTable}
      data={columns as unknown as EntityData[]}
      onRowClick={(row) => setFocusedColumnId(row.original.id)}
    />
  );
}

export const FieldGroupSheetFields = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: dataSetDefinitionSchema,
    onMount: dataSetDefinitionSchema,
  },
  props: {
    sheetIndex: 0,
    focusedColumnId: 0 as number | null,
    setFocusedColumnId: (() => {}) as (id: number | null) => void,
    onDelete: () => {},
  },
  render: function Render({
    form,
    sheetIndex,
    focusedColumnId,
    setFocusedColumnId,
    onDelete,
  }) {
    return (
      <>
        <Surface>
          {DATA_SHEET_FIELDS.map((fieldDef) => (
            <form.AppField
              name={
                `sheets[${sheetIndex}].${fieldDef.name}` as DeepKeys<DataSetDefinitionFull>
              }
              key={fieldDef.name}
            >
              {(field) => <field.DataSheetDefinitionEditorField fieldDef={fieldDef} />}
            </form.AppField>
          ))}
          <ButtonGroup>
            <Button color="danger" onClick={onDelete}>
              Delete
            </Button>
          </ButtonGroup>
        </Surface>
        <form.AppField name={`sheets[${sheetIndex}].columns`} mode="array">
          {(field) => {
            return (
              <>
                {focusedColumnId === null && (
                  <SheetColumnsTable
                    columns={field.state.value}
                    setFocusedColumnId={setFocusedColumnId}
                  />
                )}
                {field.state.value?.map((column, i) =>
                  focusedColumnId === column.id ? (
                    <FieldGroupColumnFields
                      key={column.id}
                      form={form}
                      sheetIndex={sheetIndex}
                      columnIndex={i}
                      onDone={() => setFocusedColumnId(null)}
                      onDelete={() => {
                        field.removeValue(i);
                        setFocusedColumnId(null);
                      }}
                    />
                  ) : (
                    <FieldGroupHiddenColumnFields
                      key={column.id}
                      form={form}
                      sheetIndex={sheetIndex}
                      columnIndex={i}
                    />
                  ),
                )}
              </>
            );
          }}
        </form.AppField>
      </>
    );
  },
});

export const FieldGroupHiddenSheetFields = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: dataSetDefinitionSchema,
    onMount: dataSetDefinitionSchema,
  },
  props: {
    sheetIndex: 0,
  },
  render: function Render({ form, sheetIndex }) {
    return [
      DATA_SHEET_FIELDS.map((fieldDef) => (
        <form.AppField
          name={
            `sheets[${sheetIndex}].${fieldDef.name}` as DeepKeys<DataSetDefinitionFull>
          }
          key={fieldDef.name}
        >
          {() => null}
        </form.AppField>
      )),
      <form.AppField name={`sheets[${sheetIndex}].columns`} mode="array">
        {(field) =>
          field.state.value.map((column, columnIndex) => (
            <FieldGroupHiddenColumnFields
              key={column.id}
              form={form}
              sheetIndex={sheetIndex}
              columnIndex={columnIndex}
            />
          ))
        }
      </form.AppField>,
    ];
  },
});
