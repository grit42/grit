import {
  BaseFormState,
  DeepKeys,
  FieldMetaBase,
  Form,
  FormFieldDef,
  ReactFormExtendedApi,
  useForm,
  useFormInputs,
  useStore,
} from "@grit42/form";
import { AssayModelData } from "../../../../../../../queries/assay_models";
import z from "zod";
import { Fragment, useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Spinner,
  Surface,
  Tabs,
} from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import { AssayDataSheetDefinitionData } from "../../../../../../../queries/assay_data_sheet_definitions";
import styles from "./dataSheetStructureLoader.module.scss";
import {
  EntityData,
  EntityFormFieldDef,
  useCreateEntityMutation,
} from "@grit42/core";
import { useTableColumns } from "@grit42/core/utils";
import { Table, useSetupTableState } from "@grit42/table";
import { AssayDataSheetColumnData } from "../../../../../../../queries/assay_data_sheet_columns";

interface DataSetDefinition {
  id: number;
  name: string;
  description?: string | null;
}

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

interface DataSetDefinitionFull extends DataSetDefinition {
  sheets: DataSheetDefinitionFull[];
}

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
            message: `must be unique`,
            path: [idx, "safe_name"],
          });
          if (!duplicateSafeNames) {
            ctx.addIssue({
              code: "custom",
              message: `must be unique`,
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
            message: `must be unique`,
            path: [idx, "name"],
          });
          if (!duplicateNames) {
            ctx.addIssue({
              code: "custom",
              message: `must be unique`,
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

const DataSetDefinitionSchema = (modelSheets: AssayDataSheetDefinitionData[]) =>
  z.object({
    id: z.int(),
    name: z.coerce.string<string>(),
    description: z.nullish(z.coerce.string<string>().trim()),
    sheets: z.array(DataSheetDefinitionSchema).superRefine((items, ctx) => {
      const uniqueValues = new Map<string, number>();
      let duplicateSheetName = false;
      items.forEach((item, idx) => {
        const firstAppearanceIndex = uniqueValues.get(item.name);
        if (modelSheets.find(({ name }) => name === item.name)) {
          ctx.addIssue({
            code: "custom",
            message: "is already taken by an existing data sheet",
            path: [idx, "name"],
          });
        }
        if (firstAppearanceIndex !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique`,
            path: [idx, "name"],
          });
          if (!duplicateSheetName) {
            ctx.addIssue({
              code: "custom",
              message: `must be unique`,
              path: [firstAppearanceIndex, "name"],
            });
            duplicateSheetName = true;
          }
        }
        uniqueValues.set(item.name, idx);
      });
    }),
  });

interface DataSheetColumnDefinitionWithIssues
  extends DataSheetColumnDefinition {
  issues: [FormFieldDef, string][];
}

interface DataSheetDefinitionWithIssues extends DataSheetDefinition {
  sheetIndex: number;
  issues: [FormFieldDef, string][];
  columns: DataSheetColumnDefinitionWithIssues[];
}

const DataSetDefinitionFormIssues = ({
  form,
  setFocusedSheetIndex,
  setFocusedColumn,
}: {
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  setFocusedSheetIndex: React.Dispatch<React.SetStateAction<number>>;
  setFocusedColumn: React.Dispatch<React.SetStateAction<number | null>>;
}) => {
  const issues = useStore(form.baseStore, ({ values, fieldMetaBase }) => {
    const sheetsWithIssues: DataSheetDefinitionWithIssues[] = [];

    values.sheets.forEach((sheet, sheetIndex) => {
      const dataSheetIssues: [FormFieldDef, string][] = [];
      const columnsWithIssues: DataSheetColumnDefinitionWithIssues[] = [];
      DATA_SHEET_FIELDS.forEach((field) => {
        const fieldErrorMap =
          fieldMetaBase[`sheets[${sheetIndex}].${field.name}` as any]?.errorMap;
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
          columnsWithIssues.push({ ...column, issues: dataSheetColumnIssues });
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

  if (issues.length == 0) {
    return <div />;
  }

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
        <h2>Issues</h2>
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
                        {field.display_name} {issue}
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
};

const ColumnForm = ({
  form,
  sheetIndex,
  columnIndex,
  onDone,
  onDelete,
}: {
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  sheetIndex: number;
  columnIndex: number;
  onDone?: () => void;
  onDelete?: () => Promise<void>;
}) => {
  const inputs = useFormInputs();

  const columnNameFieldNames = useStore(form.baseStore, ({ values }) =>
    values.sheets[sheetIndex].columns.map(
      (_, index) => `sheets[${sheetIndex}].columns[${index}].name`,
    ),
  );
  const columnSafeNameFieldNames = useStore(form.baseStore, ({ values }) =>
    values.sheets[sheetIndex].columns.map(
      (_, index) => `sheets[${sheetIndex}].columns[${index}].safe_name`,
    ),
  );

  return (
    <Surface
      style={{ width: "100%", maxWidth: 960, margin: "auto", height: "100%" }}
    >
      {DATA_SHEET_COLUMN_FIELDS.map((fieldDef) => {
        const Input = inputs[fieldDef.type] ?? inputs["default"];
        return (
          <form.Field
            name={
              `sheets[${sheetIndex}].columns[${columnIndex}].${fieldDef.name}` as DeepKeys<DataSetDefinitionFull>
            }
            key={`sheets[${sheetIndex}].columns[${columnIndex}].${fieldDef.name}`}
          >
            {(field) => (
              <Input
                field={fieldDef}
                handleChange={(v) => {
                  field.handleChange(v);
                  if (fieldDef.name === "name") {
                    form.baseStore.setState((prev) => {
                      const nameFieldsMeta: Partial<
                        Record<DeepKeys<DataSetDefinitionFull>, FieldMetaBase>
                      > = {};
                      for (const key of columnNameFieldNames) {
                        const field = key as DeepKeys<DataSetDefinitionFull>;
                        nameFieldsMeta[field] = {
                          ...prev.fieldMetaBase[field],
                          errorMap: {},
                        };
                      }

                      return {
                        ...prev,
                        fieldMetaBase: {
                          ...prev.fieldMetaBase,
                          ...nameFieldsMeta,
                        },
                      } as BaseFormState<DataSetDefinitionFull>;
                    });
                  } else if (fieldDef.name === "safe_name") {
                    form.baseStore.setState((prev) => {
                      const safeNameFieldsMeta: Partial<
                        Record<DeepKeys<DataSetDefinitionFull>, FieldMetaBase>
                      > = {};
                      for (const key of columnSafeNameFieldNames) {
                        const field = key as DeepKeys<DataSetDefinitionFull>;
                        safeNameFieldsMeta[field] = {
                          ...prev.fieldMetaBase[field],
                          errorMap: {},
                        };
                      }

                      return {
                        ...prev,
                        fieldMetaBase: {
                          ...prev.fieldMetaBase,
                          ...safeNameFieldsMeta,
                        },
                      } as BaseFormState<DataSetDefinitionFull>;
                    });
                  }
                }}
                disabled={false}
                error={Array.from(new Set(field.state.meta.errors)).join("\n")}
                handleBlur={field.handleBlur}
                value={field.state.value}
              />
            )}
          </form.Field>
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

const SheetColumns = ({
  form,
  sheetIndex,
  focusedColumn,
  setFocusedColumn,
}: {
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  sheetIndex: number;
  focusedColumn: number | null;
  setFocusedColumn: React.Dispatch<React.SetStateAction<number | null>>;
}) => {
  const tableColumns = useTableColumns(DATA_SHEET_COLUMN_COLUMNS ?? []);

  const tableState = useSetupTableState("sheet-columns", tableColumns, {
    saveState: {
      columnSizing: true,
    },
  });

  return (
    <form.Field name={`sheets[${sheetIndex}].columns`} mode="array">
      {(field) => (
        <>
          {!focusedColumn && (
            <Table
              header="Columns"
              tableState={tableState}
              className={styles.typesTable}
              data={field.state.value as unknown as EntityData[]}
              onRowClick={(row) => setFocusedColumn(row.original.id)}
            />
          )}
          {field.state.value?.map((column, columnIndex) => {
            if (focusedColumn !== column.id) {
              return DATA_SHEET_COLUMN_FIELDS.map((fieldDef) => {
                return (
                  <form.Field
                    name={
                      `sheets[${sheetIndex}].columns[${columnIndex}].${fieldDef.name}` as any
                    }
                    key={`sheets[${sheetIndex}].columns[${columnIndex}].${fieldDef.name}`}
                  >
                    {() => null}
                  </form.Field>
                );
              });
            }
            return (
              <ColumnForm
                key={column.id}
                sheetIndex={sheetIndex}
                columnIndex={columnIndex}
                form={form}
                onDelete={async () => {
                  await field.removeValue(columnIndex);
                  setFocusedColumn(null);
                }}
                onDone={() => setFocusedColumn(null)}
              />
            );
          })}
        </>
      )}
    </form.Field>
  );
};

const SheetForm = ({
  form,
  sheetIndex,
  onDelete,
}: {
  sheetIndex: number;
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  isFocusedSheet: boolean;
  onDelete?: () => Promise<void>;
  sheet: DataSheetDefinitionFull;
}) => {
  const inputs = useFormInputs();

  const sheetNameFieldNames = useStore(form.baseStore, ({ values }) =>
    values.sheets.map((_, index) => `sheets[${index}].name`),
  );

  return (
    <Surface>
      {DATA_SHEET_FIELDS.map((fieldDef) => {
        const Input = inputs[fieldDef.type] ?? inputs["default"];
        return (
          <form.Field
            name={
              `sheets[${sheetIndex}].${fieldDef.name}` as DeepKeys<DataSetDefinitionFull>
            }
            key={`sheets[${sheetIndex}].${fieldDef.name}`}
          >
            {(field) => (
              <Input
                field={fieldDef}
                handleChange={(v) => {
                  field.handleChange(v);
                  if (fieldDef.name === "name") {
                    form.baseStore.setState((prev) => {
                      const nameFieldsMeta: Partial<
                        Record<DeepKeys<DataSetDefinitionFull>, FieldMetaBase>
                      > = {};
                      for (const key of sheetNameFieldNames) {
                        const field = key as DeepKeys<DataSetDefinitionFull>;
                        nameFieldsMeta[field] = {
                          ...prev.fieldMetaBase[field],
                          errorMap: {},
                        };
                      }

                      return {
                        ...prev,
                        fieldMetaBase: {
                          ...prev.fieldMetaBase,
                          ...nameFieldsMeta,
                        },
                      } as BaseFormState<DataSetDefinitionFull>;
                    });
                  }
                }}
                disabled={false}
                error={field.state.meta.errors.join("\n")}
                handleBlur={field.handleBlur}
                value={field.state.value}
              />
            )}
          </form.Field>
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

const Header = ({
  form,
}: {
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
}) => {
  const navigate = useNavigate();
  return (
    <div className={styles.dataSheetsFormHeader}>
      <h3 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        Data sheet definitions import: verify column definitions{" "}
        {form.state.isValidating && <Spinner />}
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
              >
                Save sheets
              </Button>
            </div>
          )}
        />
      </ButtonGroup>
    </div>
  );
};

const DataSheetTabs = ({
  sheets,
  focusedSheetIndex,
  setFocusedSheetIndex,
}: {
  sheets: DataSheetDefinitionFull[];
  focusedSheetIndex: number;
  setFocusedSheetIndex: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const handleTabChange = (index: number) => {
    setFocusedSheetIndex(index);
  };

  return (
    <Tabs
      className={styles.dataSheetsFormHeader}
      selectedTab={focusedSheetIndex}
      onTabChange={handleTabChange}
      tabs={[
        ...(sheets.map((sheetDefinition, index) => ({
          key: sheetDefinition.id?.toString() ?? index,
          name: sheetDefinition.name,
          panel: <></>,
        })) ?? []),
      ]}
    />
  );
};

const UnfocusedSheetFields = ({
  sheet,
  sheetIndex,
  form,
}: {
  sheet: DataSheetDefinitionFull;
  sheetIndex: number;
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
}) => {
  return [
    ...DATA_SHEET_FIELDS.map((fieldDef) => (
      <form.Field
        name={`sheets[${sheetIndex}].${fieldDef.name}` as any}
        key={`sheets[${sheetIndex}].${fieldDef.name}`}
      >
        {() => null}
      </form.Field>
    )),
    ...sheet.columns.map((_, cIndex) =>
      DATA_SHEET_COLUMN_FIELDS.map((fieldDef) => {
        return (
          <form.Field
            name={
              `sheets[${sheetIndex}].columns[${cIndex}].${fieldDef.name}` as any
            }
            key={`sheets[${sheetIndex}].columns[${cIndex}].${fieldDef.name}`}
          >
            {() => null}
          </form.Field>
        );
      }),
    ),
  ].flat();
};

const DSDE = ({
  dataSetDefinition,
  assayModelDataSheets,
}: {
  assayModel: AssayModelData;
  assayModelDataSheets: AssayDataSheetDefinitionData[];
  dataSetDefinition: DataSetDefinitionFull;
}) => {
  const navigate = useNavigate();
  const [focusedSheetIndex, setFocusedSheetIndex] = useState<number>(0);
  const [focusedColumn, setFocusedColumn] = useState<number | null>(null);

  const createSheetDefinitionMutation =
    useCreateEntityMutation<AssayDataSheetDefinitionData>(
      "grit/assays/assay_data_sheet_definitions",
    );

  const createSheetColumnMutation =
    useCreateEntityMutation<AssayDataSheetColumnData>(
      "grit/assays/assay_data_sheet_columns",
    );

  const schema = useMemo(
    () => DataSetDefinitionSchema(assayModelDataSheets),
    [assayModelDataSheets],
  );

  const form = useForm({
    defaultValues: dataSetDefinition,
    validators: {
      onChangeAsync: schema,
      onMount: schema,
    },
    onSubmit: async ({ value }) => {
      try {
        DataSetDefinitionSchema([]).parse(value);
      } catch (error) {
        console.log(error);
        return;
      }

      let firstSheetId;
      for (const sheet of value.sheets) {
        const assayDataSheetDefinition =
          await createSheetDefinitionMutation.mutateAsync({
            assay_model_id: dataSetDefinition.id,
            name: sheet.name,
            description: sheet.description,
            result: sheet.result,
            sort: sheet.sort,
          });

        firstSheetId = firstSheetId || assayDataSheetDefinition.id;

        for (const col of sheet.columns) {
          await createSheetColumnMutation.mutateAsync({
            assay_data_sheet_definition_id: assayDataSheetDefinition.id,
            name: col.name,
            safe_name: col.safe_name,
            data_type_id: col.data_type_id,
            required: false,
            sort: col.sort,
            description: col.description,
          });
        }
      }

      navigate(`../../data-sheets/${firstSheetId}`);
    },
  });

  return (
    <Form form={form} className={styles.dataSheetsForm}>
      <Header form={form} />
      <form.Field name="sheets" mode="array">
        {(field) => (
          <>
            <DataSetDefinitionFormIssues
              form={form}
              setFocusedColumn={setFocusedColumn}
              setFocusedSheetIndex={setFocusedSheetIndex}
            />
            <div className={styles.dataSheetsForm}>
              <DataSheetTabs
                sheets={field.state.value}
                focusedSheetIndex={focusedSheetIndex}
                setFocusedSheetIndex={setFocusedSheetIndex}
              />
              {field.state.value.map((sheet, sIndex) => {
                if (sIndex !== focusedSheetIndex) {
                  return (
                    <UnfocusedSheetFields
                      key={`unfocused-sheet-fields-${sheet.id}`}
                      form={form}
                      sheet={sheet}
                      sheetIndex={sIndex}
                    />
                  );
                }

                return (
                  <Fragment key={`focused-sheet-fields-${sheet.id}`}>
                    <SheetForm
                      isFocusedSheet={sIndex === focusedSheetIndex}
                      key={`sheet-form-${sheet.id}`}
                      sheetIndex={sIndex}
                      form={form}
                      sheet={sheet}
                      onDelete={async () => {
                        const nextSheetIndex = Math.max(
                          0,
                          Math.min(sIndex, field.state.value.length - 2),
                        );

                        setFocusedSheetIndex(nextSheetIndex);
                        setFocusedColumn(null);
                        await field.removeValue(sIndex);
                      }}
                    />
                    <SheetColumns
                      key={`sheet-columns-${sheet.id}`}
                      form={form}
                      sheetIndex={sIndex}
                      focusedColumn={focusedColumn}
                      setFocusedColumn={setFocusedColumn}
                    />
                  </Fragment>
                );
              })}
            </div>
          </>
        )}
      </form.Field>
    </Form>
  );
};

export default DSDE;
