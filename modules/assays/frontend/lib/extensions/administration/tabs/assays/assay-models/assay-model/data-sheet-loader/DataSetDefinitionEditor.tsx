/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { useCallback, useEffect } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import {
  EntityData,
  EntityPropertyDef,
  useCreateEntityMutation,
} from "@grit42/core";
import {
  Form,
  FormField,
  FormFieldDef,
  ReactFormExtendedApi,
  useForm,
  useStore,
} from "@grit42/form";
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumnColumns,
  useAssayDataSheetColumnFields,
} from "../../../../../../../queries/assay_data_sheet_columns";
import { Table, useSetupTableState } from "@grit42/table";
import { toSafeIdentifier, useTableColumns } from "@grit42/core/utils";
import * as z from "zod";

const DataSheetColumnForm = ({
  fields,
  dataSheetDefinitionIndex,
  dataSheetColumnDefinition,
  dataSheetColumnDefinitionIndex,
  form,
}: {
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  fields: FormFieldDef[];
  dataSheetColumnDefinition: DataSheetColumnDefinition;
  dataSheetDefinitionIndex: number;
  dataSheetColumnDefinitionIndex: number;
}) => {
  const navigate = useNavigate();

  const onDelete = async () => {
    if (
      !dataSheetColumnDefinition.id ||
      !window.confirm(
        `Are you sure you want to delete this column? This action is irreversible`,
      )
    ) {
      return;
    }

    form.setFieldValue(`sheets[${dataSheetDefinitionIndex}].columns`, (v) =>
      v.toSpliced(dataSheetColumnDefinitionIndex, 1),
    );

    navigate("..");
  };

  const subFields = useMemo(
    () =>
      fields.map((f) => ({
        ...f,
        name: `sheets[${dataSheetDefinitionIndex}].columns[${dataSheetColumnDefinitionIndex}].${f.name}`,
      })),
    [fields, dataSheetDefinitionIndex, dataSheetColumnDefinitionIndex],
  );

  return (
    <Surface className={styles.modelForm}>
      <h2 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        {dataSheetColumnDefinition.id ? "Edit" : "New"} column
      </h2>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridAutoRows: "max-content",
          gap: "calc(var(--spacing) * 2)",
          paddingBottom: "calc(var(--spacing) * 2)",
        }}
      >
        {subFields.map((f) => (
          <FormField form={form} fieldDef={f} key={f.name} />
        ))}
        <div style={{ gridColumnStart: 1, gridColumnEnd: -1 }}>
          <ButtonGroup>
            <Button onClick={() => navigate("..")}>Done</Button>
            <Button color="danger" onClick={onDelete}>
              Delete
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </Surface>
  );
};

const DataSheetColumn = ({
  fields,
  dataSheetDefinitionIndex,
  form,
}: {
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  fields: FormFieldDef[];
  dataSheetDefinition: DataSheetDefinitionFull;
  dataSheetDefinitionIndex: number;
}) => {
  const { column_id } = useParams() as {
    column_id: string;
  };

  const dataSheetDefinition = useStore(
    form.baseStore,
    ({ values }) => values.sheets[dataSheetDefinitionIndex],
  ) as DataSheetDefinitionFull;

  const dataSheetColumnDefinitionIndex = useMemo(
    () =>
      dataSheetDefinition.columns.findIndex(
        ({ id }) => id.toString() === column_id,
      ),
    [column_id, dataSheetDefinition.columns],
  );

  const dataSheetColumnDefinition =
    dataSheetDefinition.columns[dataSheetColumnDefinitionIndex];

  return (
    <DataSheetColumnForm
      form={form}
      fields={fields}
      dataSheetDefinitionIndex={dataSheetDefinitionIndex}
      dataSheetColumnDefinitionIndex={dataSheetColumnDefinitionIndex}
      dataSheetColumnDefinition={dataSheetColumnDefinition}
    />
  );
};

const DataSheetColumnsTable = ({
  dataSheetDefinition,
  columns,
  dataSheetDefinitionIndex,
  form,
}: {
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  dataSheetDefinition: DataSheetDefinitionFull;
  columns: EntityPropertyDef[];
  dataSheetDefinitionIndex: number;
}) => {
  const navigate = useNavigate();

  const tableColumns = useTableColumns(columns ?? []);

  const tableState = useSetupTableState("sheet-columns", tableColumns, {
    saveState: {
      columnSizing: true,
    },
  });

  const onNew = () => {
    const id = Math.abs(Date.now() | (Date.now() * Math.random()));
    form.setFieldValue(`sheets[${dataSheetDefinitionIndex}].columns`, (v) =>
      v.toSpliced(-1, 0, {
        id,
        assay_data_sheet_definition_id: dataSheetDefinition.id,
        assay_data_sheet_definition_id__name: dataSheetDefinition.name,
        data_type_id: 0,
        data_type_id__name: "",
        name: "",
        safe_name: "",
        required: false,
      }),
    );

    navigate(id.toString());
  };

  const data = useStore(
    form.baseStore,
    ({ values }) => values.sheets[dataSheetDefinitionIndex].columns,
  );

  return (
    <>
      <Table
        header="Columns"
        tableState={tableState}
        headerActions={<Button onClick={onNew}>New</Button>}
        className={styles.typesTable}
        data={data as unknown as EntityData[]}
        onRowClick={(row) => navigate(row.original.id.toString())}
      />
    </>
  );
};

const DataSheetColumnDefinitionsEditor = ({
  dataSheetDefinition,
  dataSheetDefinitionIndex,
  columns,
  form,
  fields,
}: {
  // addColumn: () => DataSheetColumnDefinition;
  // deleteColumn: (id: number) => void;
  dataSheetDefinition: DataSheetDefinitionFull;
  dataSheetDefinitionIndex: number;
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  fields: FormFieldDef[];
  columns: EntityPropertyDef[];
}) => {
  return (
    <Routes>
      <Route
        index
        element={
          <DataSheetColumnsTable
            dataSheetDefinition={dataSheetDefinition}
            dataSheetDefinitionIndex={dataSheetDefinitionIndex}
            form={form}
            columns={columns}
          />
        }
      />
      <Route
        path=":column_id"
        element={
          <DataSheetColumn
            dataSheetDefinition={dataSheetDefinition}
            dataSheetDefinitionIndex={dataSheetDefinitionIndex}
            fields={fields}
            form={form}
          />
        }
      />
    </Routes>
  );
};

import { useMemo, useState } from "react";
import { Outlet, useMatch } from "react-router-dom";
import { Tabs } from "@grit42/client-library/components";
import { useEntityData } from "@grit42/core";
import {
  AssayDataSheetDefinitionData,
  useAssayDataSheetDefinitionFields,
} from "../../../../../../../queries/assay_data_sheet_definitions";
import styles from "./dataSheetStructureLoader.module.scss";
import {
  AssayModelData,
  useAssayModelFields,
} from "../../../../../../../queries/assay_models";
import { SheetWithColumns } from "./SheetMapper";

interface Props {
  dataSetDefinition: DataSetDefinitionFull;
  dataSheetDefinitionFields: FormFieldDef[];
  dataSheetColumnDefinitionFields: FormFieldDef[];
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
}

interface DataSheetColumnDefinitionWithIssues
  extends DataSheetColumnDefinition {
  issues: [FormFieldDef, string][];
}

interface DataSheetDefinitionWithIssues extends DataSheetDefinition {
  issues: [FormFieldDef, string][];
  columns: DataSheetColumnDefinitionWithIssues[];
}

const DataSetDefinitionFormIssues = ({
  form,
  dataSheetDefinitionFields,
  dataSheetColumnDefinitionFields,
}: Props) => {
  const issues = useStore(form.baseStore, ({ values, fieldMetaBase }) => {
    const sheetsWithIssues: DataSheetDefinitionWithIssues[] = [];

    values.sheets.forEach((sheet, sheetIndex) => {
      const dataSheetIssues: [FormFieldDef, string][] = [];
      const columnsWithIssues: DataSheetColumnDefinitionWithIssues[] = [];
      dataSheetDefinitionFields.forEach((field) => {
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
        dataSheetColumnDefinitionFields.forEach((field) => {
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
          columns: columnsWithIssues,
          issues: dataSheetIssues,
        });
      }
    });

    return sheetsWithIssues;
  });

  if (issues.length == 0) {
    return null;
  }

  return (
    <div style={{ height: "100%", width: "100%", overflow: "auto" }}>
      <Surface
        style={{
          height: "100%",
          width: "100%",
          maxWidth: "200px",
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
            <Link to={`${sheet.id}`}><h3>Sheet "{sheet.name}"</h3></Link>
            <ul style={{ paddingInlineStart: "var(--spacing)", listStylePosition: "inside", listStyle: "none", marginBlock: "var(--spacing)" }}>
              {sheet.issues.map(([field, issue]) => (
                <li key={`${sheet.id}-${field.name}`}>
                  <>
                    {field.display_name}: {issue}
                  </>
                </li>
              ))}
              {sheet.columns.map((column) => (
                <li key={`${sheet.id}-${column.id}`}>
                  <Link to={`${sheet.id}/${column.id}`}><h4>Column "{column.name}"</h4></Link>
                  <ul
                    style={{
                      paddingInlineStart: "var(--spacing)",
                      paddingBottom: "var(--spacing)",
                      listStylePosition: "inside"
                      , listStyle: "none"
                    }}
                  >
                    {column.issues.map(([field, issue]) => (
                      <li key={`${sheet.id}-${column.id}-${field.name}`}>
                        {field.display_name}: {issue}
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

export const DataSheetDefinitionTabs = ({
  dataSetDefinition,
  form,
  dataSheetDefinitionFields,
  dataSheetColumnDefinitionFields,
}: Props) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();

  const match = useMatch(
    "/core/administration/assays/assay-models/:assay_model_id/data-sheet-loader/edit/:data_sheet_definition_id?/*",
  );

  const data_sheet_definition_id = match?.params.data_sheet_definition_id ?? 0;

  const [selectedTab, setSelectedTab] = useState(
    dataSetDefinition.sheets.findIndex(
      ({ id }) => data_sheet_definition_id === id.toString(),
    ) ?? 0,
  );

  useEffect(() => {
    if (data_sheet_definition_id === "new") {
      setSelectedTab(dataSetDefinition.sheets.length);
    } else {
      setSelectedTab(
        dataSetDefinition.sheets.findIndex(
          ({ id }) => data_sheet_definition_id === id.toString(),
        ),
      );
    }
  }, [data_sheet_definition_id, dataSetDefinition.sheets]);

  const handleTabChange = (index: number) => {
    if (index === dataSetDefinition.sheets.length) {
      navigate("new", { replace: true });
    }
    if (
      selectedTab !== index &&
      dataSetDefinition.sheets.length &&
      dataSetDefinition.sheets[index]
    ) {
      navigate(dataSetDefinition.sheets[index].id.toString(), {
        replace: true,
      });
    }
  };

  const navigateToNew = useCallback(
    () => navigate("new", { replace: true }),
    [navigate],
  );

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New sheet",
          onClick: navigateToNew,
          disabled: data_sheet_definition_id === "new",
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, data_sheet_definition_id]);

  return (
    <Form form={form} className={styles.dataSheets}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h3 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
          Data sheet definitions import: verify column definitions
        </h3>
        <ButtonGroup>
          <Button onClick={() => navigate("../map")}>Back to mapping</Button>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <div className={styles.controls}>
                <ButtonGroup>
                  <Button
                    color="secondary"
                    disabled={!canSubmit}
                    type="submit"
                    loading={isSubmitting}
                  >
                    Save sheets
                  </Button>
                </ButtonGroup>
              </div>
            )}
          />
        </ButtonGroup>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          gridTemplateRows: "min-content 1fr",
          overflow: "auto",
          width: "100%",
          height: "100%",
          columnGap: "var(--spacing)",
        }}
      >
        <div
          style={{
            overflow: "auto",
            width: "100%",
            height: "100%",
            gridRowStart: 1,
            gridRowEnd: -1,
          }}
        >
          <DataSetDefinitionFormIssues
            dataSheetDefinitionFields={dataSheetDefinitionFields}
            dataSheetColumnDefinitionFields={dataSheetColumnDefinitionFields}
            form={form}
            dataSetDefinition={dataSetDefinition}
          />
        </div>
        <Tabs
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
          tabs={[
            ...(dataSetDefinition.sheets.map((sheetDefinition) => ({
              key: sheetDefinition.id.toString(),
              name: sheetDefinition.name,
              panel: <></>,
            })) ?? []),
          ]}
        />
        <Outlet />
      </div>
    </Form>
  );
};

const DataSheetDefinitionForm = ({
  fields,
  form,
  dataSheetDefinition,
  dataSheetDefinitionIndex,
  onDeleteRedirectId,
}: {
  fields: FormFieldDef[];
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  dataSheetDefinition: DataSheetDefinition;
  dataSheetDefinitionIndex: number;
  onDeleteRedirectId: string | null;
}) => {
  const navigate = useNavigate();

  const onDelete = async () => {
    if (
      !window.confirm(
        `Are you sure you want to delete this data sheet? This action is irreversible`,
      )
    ) {
      return;
    }
    form.setFieldValue("sheets", (v) =>
      v.toSpliced(dataSheetDefinitionIndex, 1),
    );
    navigate(`../${onDeleteRedirectId ?? ""}`, { replace: true });
  };

  const subFields = useMemo(
    () =>
      fields.map((f) => ({
        ...f,
        name: `sheets[${dataSheetDefinitionIndex}].${f.name}`,
      })),
    [fields, dataSheetDefinitionIndex],
  );

  return (
    <Surface style={{ width: "100%" }}>
      {!dataSheetDefinition.id && (
        <h2 style={{ alignSelf: "baseline", marginBottom: ".5em" }}>
          New sheet
        </h2>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gridAutoRows: "max-content",
          gap: "calc(var(--spacing) * 2)",
          paddingBottom: "calc(var(--spacing) * 2)",
        }}
      >
        {subFields.map((f) => (
          <FormField form={form} fieldDef={f} key={f.name} />
        ))}
        <div style={{ gridColumnStart: 1, gridColumnEnd: -1 }}>
          <Button color="danger" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Surface>
  );
};

const DataSheetDefinitionEditor = ({
  dataSetDefinition,
  form,
  dataSheetDefinitionFields,
  dataSheetColumnDefinitionFields,
  dataSheetColumnDefinitionColumns,
}: {
  dataSetDefinition: DataSetDefinitionFull;
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  dataSheetDefinitionFields: FormFieldDef[];
  dataSheetColumnDefinitionFields: FormFieldDef[];
  dataSheetColumnDefinitionColumns: EntityPropertyDef[];
}) => {
  const { data_sheet_definition_id } = useParams() as {
    data_sheet_definition_id: string | undefined;
  };

  const dataSheetDefinitionIndex = useMemo(() => {
    return Math.max(
      dataSetDefinition.sheets.findIndex(
        ({ id }) => id.toString() === data_sheet_definition_id,
      ),
      0,
    );
  }, [dataSetDefinition.sheets, data_sheet_definition_id]);

  const dataSheetDefinition =
    dataSetDefinition.sheets[dataSheetDefinitionIndex];

  const deleteRedirectId = useMemo(() => {
    return (
      dataSetDefinition.sheets
        .find(({ id }) => id.toString() !== data_sheet_definition_id)
        ?.id.toString() ?? null
    );
  }, [dataSetDefinition.sheets, data_sheet_definition_id]);

  if (!dataSheetDefinition) {
    return (
      <Navigate
        to={`../${dataSetDefinition.sheets[0].id.toString()}`}
        replace
      />
    );
  }

  return (
    <div className={styles.dataSheet}>
      <DataSheetDefinitionForm
        key={data_sheet_definition_id}
        dataSheetDefinition={dataSheetDefinition}
        onDeleteRedirectId={deleteRedirectId}
        form={form}
        fields={dataSheetDefinitionFields}
        dataSheetDefinitionIndex={dataSheetDefinitionIndex}
      />
      <DataSheetColumnDefinitionsEditor
        dataSheetDefinition={dataSheetDefinition}
        fields={dataSheetColumnDefinitionFields}
        columns={dataSheetColumnDefinitionColumns}
        form={form}
        dataSheetDefinitionIndex={dataSheetDefinitionIndex}
      />
    </div>
  );
};

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

interface DataSheetDefinition {
  id: number;
  assay_model_id: number;
  assay_model_id__name: string;
  name: string;
  result?: boolean | null;
  description?: string | null;
  sort?: number | null;
}

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
      const uniqueValues = new Map<string, number>();
      items.forEach((item, idx) => {
        const firstAppearanceIndex = uniqueValues.get(item.safe_name);
        if (firstAppearanceIndex !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique`,
            path: [idx, "safe_name"],
          });
          ctx.addIssue({
            code: "custom",
            message: `must be unique`,
            path: [firstAppearanceIndex, "safe_name"],
          });
          return;
        }
        uniqueValues.set(item.safe_name, idx);
      });
    }),
});

const DataSetDefinitionSchema = z.object({
  id: z.int(),
  name: z.coerce.string<string>(),
  description: z.nullish(z.coerce.string<string>().trim()),
  sheets: z.array(DataSheetDefinitionSchema),
});

interface DataSetDefinition {
  id: number;
  name: string;
  description?: string | null;
}

interface DataSheetDefinitionFull extends DataSheetDefinition {
  columns: DataSheetColumnDefinition[];
}

interface DataSetDefinitionFull extends DataSetDefinition {
  sheets: DataSheetDefinitionFull[];
}

const Wrapper = ({
  assayModel,
  sheetsWithColumns,
}: {
  assayModel: AssayModelData;
  sheetsWithColumns: SheetWithColumns[];
}) => {
  const {
    data: dataTypes,
    isLoading: isDataTypesLoading,
    isError: isDataTypesError,
    error: dataTypesError,
  } = useEntityData("grit/core/data_types");

  const dataSetDefinition: DataSetDefinitionFull = useMemo(() => {
    return {
      id: assayModel.id,
      name: assayModel.name,
      description: assayModel.description,
      sheets: sheetsWithColumns.map(
        (s): DataSheetDefinitionFull => ({
          id: s.id,
          sort: s.sort,
          name: s.name,
          result: false,
          assay_model_id: assayModel.id,
          assay_model_id__name: assayModel.name,
          columns: s.columns.map((c): DataSheetColumnDefinition => {
            const dataType = dataTypes?.find(
              (d) => d.name === c.detailed_data_type,
            );
            return {
              ...c,
              safe_name: c.identifier ?? toSafeIdentifier(c.name),
              assay_data_sheet_definition_id: s.id,
              assay_data_sheet_definition_id__name: s.name,
              data_type_id: dataType?.id ?? 0,
              data_type_id__name: (dataType?.name as string) ?? "",
              required: false,
            };
          }),
        }),
      ),
    };
  }, [assayModel, sheetsWithColumns, dataTypes]);

  if (isDataTypesLoading) {
    return <Spinner />;
  }
  if (isDataTypesError || !dataTypes) {
    return <ErrorPage error={dataTypesError} />;
  }

  return <DataSetDefinitionEditor dataSetDefinition={dataSetDefinition} />;
};

const DataSetDefinitionEditor = ({
  dataSetDefinition,
}: {
  dataSetDefinition: DataSetDefinitionFull;
}) => {
  const navigate = useNavigate();

  const {
    data: dataTypes,
    isLoading: isDataTypesLoading,
    isError: isDataTypesError,
    error: dataTypesError,
  } = useEntityData("grit/core/data_types");

  const {
    data: dataSetDefinitionFields,
    isLoading: isDataSetDefinitionFieldsLoading,
    isError: isDataSetDefinitionFieldsError,
    error: dataSetDefinitionFieldsError,
  } = useAssayModelFields();

  const {
    data: dataSheetDefinitionFields,
    isLoading: isDataSheetDefinitionFieldsLoading,
    isError: isDataSheetDefinitionFieldsError,
    error: dataSheetDefinitionFieldsError,
  } = useAssayDataSheetDefinitionFields(undefined, {
    select: (data) => data.filter((d) => !["assay_model_id"].includes(d.name)),
  });

  const {
    data: dataSheetColumnDefinitionFields,
    isLoading: isDataSheetColumnDefinitionFieldsLoading,
    isError: isDataSheetColumnDefinitionFieldsError,
    error: dataSheetColumnDefinitionFieldsError,
  } = useAssayDataSheetColumnFields(undefined, {
    select: (data) =>
      data.filter((d) => !["assay_data_sheet_definition_id"].includes(d.name)),
  });

  const {
    data: dataSheetColumnDefinitionColumns,
    isLoading: isDataSheetColumnDefinitionColumnsLoading,
    isError: isDataSheetColumnDefinitionColumnsError,
    error: dataSheetColumnDefinitionColumnsError,
  } = useAssayDataSheetColumnColumns(undefined, {
    select: (data) =>
      data.filter(
        (d) =>
          !["assay_data_sheet_definition_id__name"].includes(d.name as string),
      ),
  });

  const createSheetDefinitionMutation =
    useCreateEntityMutation<AssayDataSheetDefinitionData>(
      "grit/assays/assay_data_sheet_definitions",
    );

  const createSheetColumnMutation =
    useCreateEntityMutation<AssayDataSheetColumnData>(
      "grit/assays/assay_data_sheet_columns",
    );
  const form = useForm({
    defaultValues: dataSetDefinition,
    validators: {
      onChange: DataSetDefinitionSchema,
      onMount: DataSetDefinitionSchema,
      onBlur: DataSetDefinitionSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        DataSetDefinitionSchema.parse(value);
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

  useEffect(() => {
    if (dataSheetDefinitionFields && dataSheetColumnDefinitionFields) {
      dataSetDefinition.sheets.forEach((sheet, i) => {
        dataSheetDefinitionFields.forEach(({ name }) => {
          form.setFieldValue(
            `sheets[${i}].${name}` as any,
            sheet[name as keyof DataSheetDefinitionFull],
            // { dontUpdateMeta: true },
          );
        });
        sheet.columns.forEach((column, j) => {
          dataSheetColumnDefinitionFields.forEach(({ name }) =>
            form.setFieldValue(
              `sheets[${i}].columns[${j}].${name}` as any,
              column[name as keyof DataSheetColumnDefinition],
              // { dontUpdateMeta: true },
            ),
          );
        });
      });
      form.validateSync("mount");
    }
  }, [
    form,
    dataSheetDefinitionFields,
    dataSheetColumnDefinitionFields,
    dataSetDefinition,
  ]);

  if (
    isDataSetDefinitionFieldsLoading ||
    isDataSheetDefinitionFieldsLoading ||
    isDataSheetColumnDefinitionFieldsLoading ||
    isDataSheetColumnDefinitionColumnsLoading ||
    isDataTypesLoading
  )
    return <Spinner />;
  if (
    isDataSetDefinitionFieldsError ||
    !dataSetDefinitionFields ||
    isDataSheetDefinitionFieldsError ||
    !dataSheetDefinitionFields ||
    isDataSheetColumnDefinitionFieldsError ||
    !dataSheetColumnDefinitionFields ||
    isDataSheetColumnDefinitionColumnsError ||
    !dataSheetColumnDefinitionColumns ||
    isDataTypesError ||
    !dataTypes
  )
    return (
      <ErrorPage
        error={
          dataSetDefinitionFieldsError ??
          dataSheetDefinitionFieldsError ??
          dataSheetColumnDefinitionFieldsError ??
          dataSheetColumnDefinitionColumnsError ??
          dataTypesError
        }
      />
    );

  return (
    <Routes>
      <Route
        element={
          <DataSheetDefinitionTabs
            dataSetDefinition={dataSetDefinition}
            dataSheetDefinitionFields={dataSheetDefinitionFields}
            dataSheetColumnDefinitionFields={dataSheetColumnDefinitionFields}
            form={form}
          />
        }
      >
        <Route
          path=":data_sheet_definition_id/*"
          element={
            <DataSheetDefinitionEditor
              form={form}
              dataSetDefinition={dataSetDefinition}
              dataSheetDefinitionFields={dataSheetDefinitionFields}
              dataSheetColumnDefinitionFields={dataSheetColumnDefinitionFields}
              dataSheetColumnDefinitionColumns={
                dataSheetColumnDefinitionColumns
              }
            />
          }
        />
        <Route
          path="*"
          element={<Navigate to={dataSetDefinition.sheets[0].id.toString()} />}
        />
      </Route>
    </Routes>
  );
};

export default Wrapper;
