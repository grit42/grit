import {
  Button,
  ButtonGroup,
  Surface,
  Tabs,
} from "@grit42/client-library/components";
import styles from "../dataSheetStructureLoader.module.scss";
import { FormFieldDef, useFormInput } from "@grit42/form";
import {
  createFormHookContexts,
  createFormHook,
  DeepKeys,
  useStore,
} from "@tanstack/react-form";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { EntityFormFieldDef } from "@grit42/core";
import { useTableColumns } from "@grit42/core/utils";
import { Table, useSetupTableState } from "@grit42/table";
import z from "zod";

const DataSheetColumnDefinitionSchema = z.object({
  id: z.int(),
  name: z.coerce.string<string>().trim().nonempty(),
  description: z.nullish(z.string().trim()),
  assay_data_sheet_definition_id: z.int(),
  assay_data_sheet_definition_id__name: z.string().trim().nonempty(),
  safe_name: z.coerce.string<string>().trim().nonempty(),
  required: z.nullish(z.boolean()),
  data_type_id: z.int(),
  data_type_id__name: z.string().trim().nonempty(),
  sort: z.nullish(z.coerce.number<number>().int()),
});

const DataSheetDefinitionSchema = z.object({
  id: z.int(),
  name: z.coerce.string<string>().trim().nonempty(),
  description: z.nullish(z.string().trim()),
  assay_model_id: z.int(),
  assay_model_id__name: z.string().trim().nonempty(),
  result: z.nullish(z.boolean()),
  sort: z.nullish(z.coerce.number<number>().int()),
  columns: z
    .array(DataSheetColumnDefinitionSchema)
    .superRefine((items, ctx) => {
      const uniqueSafeNames = new Map<string, number>();
      const uniqueNames = new Map<string, number>();
      let duplicateSafeNames = false;
      let duplicateNames = false;
      items.forEach((item, idx) => {
        const firstSafeNameAppearanceIndex = uniqueSafeNames.get(
          item.safe_name,
        );
        if (firstSafeNameAppearanceIndex !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique within a data sheet`,
            path: [idx, "safe_name"],
          });
          if (!duplicateSafeNames) {
            ctx.addIssue({
              code: "custom",
              message: `must be unique within a data sheet`,
              path: [firstSafeNameAppearanceIndex, "safe_name"],
            });
            duplicateSafeNames = true;
          }
        } else {
          uniqueSafeNames.set(item.safe_name, idx);
        }
        const firstNameAppearanceIndex = uniqueNames.get(item.name);
        if (firstNameAppearanceIndex !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique within a data sheet`,
            path: [idx, "name"],
          });
          if (!duplicateNames) {
            ctx.addIssue({
              code: "custom",
              message: `must be unique within a data sheet`,
              path: [firstNameAppearanceIndex, "name"],
            });
            duplicateNames = true;
          }
        } else {
          uniqueNames.set(item.name, idx);
        }
      });
    }),
});

const DataSetDefinitionSchema = z.object({
  id: z.int(),
  name: z.coerce.string<string>(),
  description: z.nullish(z.coerce.string<string>().trim()),
  sheets: z.array(DataSheetDefinitionSchema).superRefine((items, ctx) => {
    const uniqueValues = new Map<string, number>();
    let duplicateSheetName = false;
    items.forEach((item, idx) => {
      const firstAppearanceIndex = uniqueValues.get(item.name);
      // if (modelSheets.find(({ name }) => name === item.name)) {
      //   ctx.addIssue({
      //     code: "custom",
      //     message: "is already taken by an existing data sheet",
      //     path: [idx, "name"],
      //   });
      // }
      if (firstAppearanceIndex !== undefined) {
        ctx.addIssue({
          code: "custom",
          message: `must be unique within an assay model`,
          path: [idx, "name"],
        });
        if (!duplicateSheetName) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique within an assay model`,
            path: [firstAppearanceIndex, "name"],
          });
          duplicateSheetName = true;
        }
      }
      uniqueValues.set(item.name, idx);
    });
  }),
});

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

function GritField({ fieldDef }: { fieldDef: FormFieldDef }) {
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

function Header() {
  const form = useFormContext();
  const navigate = useNavigate();

  return (
    <div className={styles.dataSheetsFormHeader}>
      <h3 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        Data sheet definitions import: verify column definitions
      </h3>
      <ButtonGroup>
        <Button onClick={() => navigate("../map")}>Back to mapping</Button>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <div>
              <Button
                color="secondary"
                disabled={!canSubmit}
                type="submit"
                loading={isSubmitting}
                onClick={() => form.handleSubmit()}
              >
                Save sheets
              </Button>
            </div>
          )}
        />
      </ButtonGroup>
    </div>
  );
}

interface DataSheetColumnDefinitionWithIssues
  extends DataSheetColumnDefinition {
  issues: [FormFieldDef, string][];
}

interface DataSheetDefinitionWithIssues extends DataSheetDefinition {
  sheetIndex: number;
  issues: [FormFieldDef, string][];
  columns: DataSheetColumnDefinitionWithIssues[];
}

function SheetTabs({
  sheets,
  focusedSheetIndex,
  setFocusedSheetIndex,
}: {
  sheets: DataSheetDefinitionFull[];
  focusedSheetIndex: number;
  setFocusedSheetIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const handleTabChange = (index: number) => {
    setFocusedSheetIndex(index);
  };

  return (
    <Tabs
      className={styles.dataSheetsFormHeader}
      selectedTab={focusedSheetIndex}
      onTabChange={handleTabChange}
      tabs={[
        ...(sheets.map((sheetDefinition) => ({
          key: sheetDefinition.id.toString(),
          name: sheetDefinition.name,
          panel: <></>,
        })) ?? []),
      ]}
    />
  );
}

const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    GritField,
    // ErrorInfo,
  },
  formComponents: {
    Header,
    SheetTabs,
  },
  fieldContext,
  formContext,
});

interface DataSheetDefinition {
  id: number;
  assay_model_id: number;
  assay_model_id__name: string;
  name: string;
  result?: boolean | null;
  description?: string | null;
  sort?: number | null;
}

interface DataSheetColumnDefinition {
  id: number;
  assay_data_sheet_definition_id: number;
  assay_data_sheet_definition_id__name: string;
  name: string;
  safe_name: string;
  required?: boolean | null;
  data_type_id: number;
  data_type_id__name: string;
  description?: string | null;
  sort?: number | null;
}

interface DataSheetDefinitionFull extends DataSheetDefinition {
  columns: DataSheetColumnDefinition[];
}

interface DataSetDefinition {
  id: number;
  name: string;
  description?: string | null;
}

interface DataSetDefinitionFull extends DataSetDefinition {
  sheets: DataSheetDefinitionFull[];
}

const defaultColumnValues: DataSheetColumnDefinition = {
  assay_data_sheet_definition_id: 0,
  assay_data_sheet_definition_id__name: "",
  data_type_id: 0,
  data_type_id__name: "",
  id: 0,
  name: "",
  safe_name: "",
  description: "",
  required: false,
  sort: 0,
};

const defaultSheetValues: DataSheetDefinitionFull = {
  id: 0,
  assay_model_id: 0,
  assay_model_id__name: "",
  name: "",
  description: null,
  sort: null,
  result: null,
  columns: [defaultColumnValues],
};

const defaultFormValues: DataSetDefinitionFull = {
  id: 0,
  name: "",
  description: "",
  sheets: [defaultSheetValues],
};

const DATA_SHEET_FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
  },
  {
    name: "description",
    display_name: "Description",
    description: "",
    type: "text",
    limit: undefined,
    required: false,
  },
  {
    name: "result",
    display_name: "Result",
    description:
      "Make this data visible in the detailed view of this model's assays",
    type: "boolean",
    limit: undefined,
    required: false,
  },
  {
    name: "sort",
    display_name: "Sort",
    description: "",
    type: "integer",
    limit: 4,
    required: false,
  },
];

const DATA_SHEET_COLUMN_FIELDS: (FormFieldDef | EntityFormFieldDef)[] = [
  {
    name: "name",
    display_name: "Name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
  },
  {
    name: "safe_name",
    display_name: "Safe name",
    description: "",
    type: "string",
    limit: undefined,
    required: true,
  },
  {
    name: "description",
    display_name: "Description",
    description: "",
    type: "text",
    limit: undefined,
    required: false,
  },
  {
    name: "sort",
    display_name: "Sort",
    description: "",
    type: "integer",
    limit: 4,
    required: false,
  },
  {
    name: "required",
    display_name: "Required",
    description: "",
    type: "boolean",
    limit: undefined,
    required: true,
  },
  {
    name: "data_type_id",
    display_name: "Data type",
    description: "",
    type: "entity",
    limit: 8,
    required: true,
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
  },
  {
    name: "unit_id",
    display_name: "Unit",
    description: "",
    type: "entity",
    limit: 8,
    required: false,
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
  },
];

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
      data={columns as any[]}
      onRowClick={(row) => setFocusedColumnId(row.original.id)}
    />
  );
}

const Issues = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: DataSetDefinitionSchema,
    onMount: DataSetDefinitionSchema,
  },
  props: {
    setFocusedSheetIndex: (() => {}) as React.Dispatch<
      React.SetStateAction<number>
    >,
    setFocusedColumn: (() => {}) as React.Dispatch<
      React.SetStateAction<number | null>
    >,
  },
  render: function Render({ setFocusedSheetIndex, setFocusedColumn, form }) {
    const issues = useStore(form.baseStore, ({ values, fieldMetaBase }) => {
      const sheetsWithIssues: DataSheetDefinitionWithIssues[] = [];

      values.sheets.forEach((sheet, sheetIndex) => {
        const dataSheetIssues: [FormFieldDef, string][] = [];
        const columnsWithIssues: DataSheetColumnDefinitionWithIssues[] = [];
        DATA_SHEET_FIELDS.forEach((field) => {
          const fieldErrorMap =
            fieldMetaBase[`sheets[${sheetIndex}].${field.name}` as any]
              ?.errorMap;
          const issue =
            fieldErrorMap?.onBlur ??
            fieldErrorMap?.onChange ??
            fieldErrorMap?.onMount ??
            fieldErrorMap?.onSubmit;
          if (issue) {
            dataSheetIssues.push([field, issue]);
          }
        });
        sheet.columns.forEach((column, columnIndex) => {
          const dataSheetColumnIssues: [FormFieldDef, string][] = [];
          DATA_SHEET_COLUMN_FIELDS.forEach((field) => {
            const fieldErrorMap =
              fieldMetaBase[
                `sheets[${sheetIndex}].columns[${columnIndex}].${field.name}` as any
              ]?.errorMap;

            const issue =
              fieldErrorMap?.onBlur ??
              fieldErrorMap?.onChange ??
              fieldErrorMap?.onMount ??
              fieldErrorMap?.onSubmit;
            if (issue) {
              dataSheetColumnIssues.push([field, issue]);
            }
          });
          if (dataSheetColumnIssues.length) {
            columnsWithIssues.push({
              ...column,
              issues: dataSheetColumnIssues,
            });
          }
        });
        if (dataSheetIssues.length || columnsWithIssues.length) {
          sheetsWithIssues.push({
            ...sheet,
            sheetIndex,
            columns: columnsWithIssues,
            issues: dataSheetIssues,
          });
        }
      });

      return sheetsWithIssues;
    });

    // if (issues.length == 0) {
    //   return <div />;
    // }

    return (
      <div style={{ height: "100%", width: "100%", overflow: "auto" }}>
        <Surface
          style={{
            height: "100%",
            width: "100%",
            minWidth: "25vw",
            maxWidth: "33vw",
            overflow: "auto",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "var(--spacing)",
            gridAutoRows: "max-content",
          }}
        >
          {issues.length == 0 && <h2>No issues!</h2>}
          {issues.length > 0 && <h2>Issues</h2>}
          {issues.map((sheet) => (
            <div key={sheet.id}>
              <a
                onClick={() => {
                  setFocusedColumn(null);
                  setFocusedSheetIndex(sheet.sheetIndex);
                }}
              >
                <h3>Sheet "{sheet.name}"</h3>
              </a>
              <ul
                style={{
                  paddingInlineStart: "var(--spacing)",
                  listStylePosition: "inside",
                  listStyle: "none",
                  marginBlock: "var(--spacing)",
                }}
              >
                {sheet.issues.map(([field, issue]) => (
                  <li key={`${sheet.id}-${field.name}`}>
                    {field.display_name} {issue}
                  </li>
                ))}
                {sheet.columns.map((column) => (
                  <li key={`${sheet.id}-${column.id}`}>
                    <a
                      onClick={() => {
                        setFocusedColumn(null);
                        setFocusedSheetIndex(sheet.sheetIndex);
                        setFocusedColumn(column.id);
                      }}
                    >
                      <h4>Column "{column.name}"</h4>
                    </a>
                    <ul
                      style={{
                        paddingInlineStart: "var(--spacing)",
                        paddingBottom: "var(--spacing)",
                        listStylePosition: "inside",
                        listStyle: "none",
                      }}
                    >
                      {column.issues.map(([field, issue]) => (
                        <li key={`${sheet.id}-${column.id}-${field.name}`}>
                          {field.display_name} {(issue as any).message}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Surface>
      </div>
    );
  },
});

const FieldGroupColumnFields = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: DataSetDefinitionSchema,
    onMount: DataSetDefinitionSchema,
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
            {(field) => <field.GritField fieldDef={fieldDef} />}
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

const FieldGroupHiddenColumnFields = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: DataSetDefinitionSchema,
    onMount: DataSetDefinitionSchema,
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

const FieldGroupSheetFields = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: DataSetDefinitionSchema,
    onMount: DataSetDefinitionSchema,
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
              {(field) => <field.GritField fieldDef={fieldDef} />}
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

const FieldGroupHiddenSheetFields = withForm({
  defaultValues: defaultFormValues,
  validators: {
    onChange: DataSetDefinitionSchema,
    onMount: DataSetDefinitionSchema,
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

function DataSheetDefinitionEditor({
  dataSetDefinition,
}: {
  dataSetDefinition: DataSetDefinitionFull;
}) {
  const [focusedSheetIndex, setFocusedSheetIndex] = useState<number>(0);
  const [focusedColumn, setFocusedColumn] = useState<number | null>(null);

  const form = useAppForm({
    defaultValues: dataSetDefinition,
    onSubmit: ({ value }) => console.log(value),
    validators: {
      onChange: DataSetDefinitionSchema,
      onMount: DataSetDefinitionSchema,
    },
  });

  return (
    <form.AppForm>
      <form
        className={styles.dataSheetsForm}
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <form.Header />
        <Issues
          form={form}
          setFocusedSheetIndex={setFocusedSheetIndex}
          setFocusedColumn={setFocusedColumn}
        />
        <form.Field name="sheets" mode="array">
          {(field) => (
            <div className={styles.dataSheetsForm}>
              <SheetTabs
                sheets={field.state.value}
                focusedSheetIndex={focusedSheetIndex}
                setFocusedSheetIndex={setFocusedSheetIndex}
              />
              {field.state.value.map((sheet, i) =>
                focusedSheetIndex === i ? (
                  <FieldGroupSheetFields
                    key={sheet.id}
                    form={form}
                    sheetIndex={i}
                    focusedColumnId={focusedColumn}
                    setFocusedColumnId={setFocusedColumn}
                    onDelete={() => field.removeValue(i)}
                  />
                ) : (
                  <FieldGroupHiddenSheetFields
                    key={sheet.id}
                    form={form}
                    sheetIndex={i}
                  />
                ),
              )}
            </div>
          )}
        </form.Field>
      </form>
    </form.AppForm>
  );
}

export default DataSheetDefinitionEditor;
