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

import { Fragment, useCallback, useEffect } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
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
  DeepKeys,
  FieldValidators,
  Form,
  FormField,
  FormFieldDef,
  ReactFormExtendedApi,
  useForm,
  useFormInputs,
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

const HideAllTheShit = ({
  form,
  dataSetDefinition,
  dataSheetColumnFields,
  dataSheetFields,
}: {
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  dataSheetFields: FormFieldDef[];
  dataSheetColumnFields: FormFieldDef[];
  dataSetDefinition: DataSetDefinitionFull;
}) => {
  const match = useMatch(
    "/core/administration/assays/assay-models/:assay_model_id/data-sheet-loader/edit/:data_sheet_definition_id/:data_sheet_column_id",
  );

  const { focusedSheetIdx, focusedColumnIdx } = useStore(
    form.baseStore,
    ({ values }) => {
      const focusedSheetIdx = values.sheets.findIndex(
        ({ id }) => id.toString() === match?.params.data_sheet_definition_id,
      );
      const focusedColumnIdx = values.sheets[focusedSheetIdx].columns.findIndex(
        ({ id }) => id.toString() === match?.params.data_sheet_column_id,
      );
      return { focusedSheetIdx, focusedColumnIdx };
    },
  );

  // return <form.Subscribe selector={(state)} ></form.Subscribe>

  const fields = dataSetDefinition.sheets
    .map((s, sIndex) => [
      s.id.toString() === match?.params.data_sheet_definition_id
        ? []
        : dataSheetFields.map(({ name }) => `sheets[${sIndex}].${name}`),
      s.columns.map((c, cIndex) => [
        c.id.toString() === match?.params.data_sheet_column_id
          ? []
          : dataSheetColumnFields.map(
              ({ name }) => `sheets[${sIndex}].columns[${cIndex}].${name}`,
            ),
      ]),
    ])
    .flat(4)
    .map((name, _, arr) => {
      if (!name.includes("columns")) return { name, onChangeListenTo: [] };
      if (name.endsWith("safe_name")) {
        return {
          name,
          onChangeListenTo: arr.filter((v) => v.includes("safe_name")),
        };
      }
      return {
        name,
        onChangeListenTo: arr.filter((v) => v.includes("name")),
      };
    });

  // console.log(Object.keys(form.state.fieldMetaBase))

  // console.log(fields)
  // const validationListeners = fieldNames.filter((f) => )

  return (
    <>
      {fields.map(({ name, onChangeListenTo }) => (
        <form.Field
          key={name}
          name={name as any}
          validators={{
            onChangeListenTo: onChangeListenTo as any,
            onChange: () => undefined,
          }}
          children={() => <div style={{ display: "none" }}></div>}
        />
      ))}
    </>
  );
};

const DataSheetColumnForm = ({
  fields,
  dataSheetDefinition,
  dataSheetDefinitionIndex,
  dataSheetColumnDefinition,
  dataSheetColumnDefinitionIndex,
  form,
}: {
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  fields: FormFieldDef[];
  dataSheetColumnDefinition: DataSheetColumnDefinition;
  dataSheetDefinition: DataSheetDefinitionFull;
  dataSheetDefinitionIndex: number;
  dataSheetColumnDefinitionIndex: number;
}) => {
  const navigate = useNavigate();
  const match = useMatch(
    "/core/administration/assays/assay-models/:assay_model_id/data-sheet-loader/edit/:data_sheet_definition_id/:data_sheet_column_id",
  );
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

  const inputs = useFormInputs();

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
        <form.Field
          name={`sheets[${dataSheetDefinitionIndex}].columns`}
          mode="array"
          validators={{
            onChange: z
              .array(DataSheetColumnDefinitionSchema)
              .superRefine((items, ctx) => {
                console.log("yoyo");
                const uniqueValues = new Map<string, number>();
                items.forEach((item, idx) => {
                  console.log(JSON.stringify(ctx.issues));
                  const firstAppearanceIndex = uniqueValues.get(item.safe_name);
                  if (firstAppearanceIndex !== undefined) {
                    ctx.addIssue({
                      code: "custom",
                      message: `must be unique ${ctx.issues.length}`,
                      path: [idx, "safe_name"],
                    });
                    ctx.addIssue({
                      code: "custom",
                      message: `must be unique ${ctx.issues.length}`,
                      path: [firstAppearanceIndex, "safe_name"],
                    });
                    return;
                  }
                  uniqueValues.set(item.safe_name, idx);
                });
              })
              .superRefine((items, ctx) => {
                console.log("yo");
                const uniqueValues = new Map<string, number>();
                items.forEach((item, idx) => {
                  const firstAppearanceIndex = uniqueValues.get(item.name);
                  if (firstAppearanceIndex !== undefined) {
                    ctx.addIssue({
                      code: "custom",
                      message: `must be unique`,
                      path: [idx, "name"],
                    });
                    ctx.addIssue({
                      code: "custom",
                      message: `must be unique`,
                      path: [firstAppearanceIndex, "name"],
                    });
                    return;
                  }
                  uniqueValues.set(item.name, idx);
                });
              }),
          }}
        >
          {(field) =>
            field.state.value.map((c, cIndex) =>
              fields
                .map((f) => ({
                  ...f,
                  name: `sheets[${dataSheetDefinitionIndex}].columns[${cIndex}].${f.name}`,
                }))
                .map((f) => (
                  <form.Field
                    key={f.name}
                    name={f.name as any}
                    children={(subfield) => {
                      console.log(f.name);
                      if (
                        c.id.toString() !== match?.params.data_sheet_column_id
                      )
                        return null;
                      const Input = inputs[f.type] ?? inputs["default"];
                      return (
                        <Input
                          field={f}
                          disabled={false}
                          handleChange={(v) => {
                            subfield.handleChange(v);
                            field.validateSync("change", {});
                          }}
                          handleBlur={subfield.handleBlur}
                          value={subfield.state.value}
                          error={Array.from(
                            new Set(subfield.state.meta.errors),
                          ).join("\n")}
                        />
                      );
                    }}
                  />
                )),
            )
          }
        </form.Field>
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
    ({ values }: any) => values.sheets[dataSheetDefinitionIndex],
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
      dataSheetDefinition={dataSheetDefinition}
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
    ({ values }: any) => values.sheets[dataSheetDefinitionIndex].columns,
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
  dataSheetDefinition: DataSheetDefinitionFull;
  dataSheetDefinitionIndex: number;
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  fields: FormFieldDef[];
  columns: EntityPropertyDef[];
  visible?: boolean;
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
  useAssayDataSheetDefinitions,
} from "../../../../../../../queries/assay_data_sheet_definitions";
import styles from "./dataSheetStructureLoader.module.scss";
import {
  AssayModelData,
  useAssayModelFields,
} from "../../../../../../../queries/assay_models";
import { SheetWithColumns } from "./SheetMapper";
import DSDE from "./DSDE";
import DataSheetDefinitionEditor from "./data-sheet-definition-editor";

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
  const issues = useStore(form.baseStore, ({ values, fieldMetaBase }: any) => {
    console.log(fieldMetaBase);
    const sheetsWithIssues: DataSheetDefinitionWithIssues[] = [];

    values.sheets.forEach((sheet: any, sheetIndex: any) => {
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
            <Link to={`${sheet.id}`}>
              <h3>Sheet "{sheet.name}"</h3>
            </Link>
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
                  <>
                    {field.display_name} {issue}
                  </>
                </li>
              ))}
              {sheet.columns.map((column) => (
                <li key={`${sheet.id}-${column.id}`}>
                  <Link to={`${sheet.id}/${column.id}`}>
                    <h4>Column "{column.name}"</h4>
                  </Link>
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
    <>
      <Form form={form} className={styles.dataSheets}>
        {/* <HideAllTheShit
          dataSetDefinition={dataSetDefinition}
          form={form}
          dataSheetColumnFields={dataSheetColumnDefinitionFields}
          dataSheetFields={dataSheetDefinitionFields}
        /> */}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <h3 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
            Data sheet definitions import: verify column definitions
          </h3>
          <ButtonGroup>
            <Button onClick={() => navigate("../map")}>Back to mapping</Button>
            <form.Subscribe
              selector={(state: any) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]: any) => (
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
    </>
  );
};

const DataSheetDefinitionForm = ({
  fields,
  form,
  dataSheetDefinition,
  dataSheetDefinitionIndex,
  onDeleteRedirectId,
  visible = false,
}: {
  fields: FormFieldDef[];
  form: ReactFormExtendedApi<DataSetDefinitionFull>;
  dataSheetDefinition: DataSheetDefinition;
  dataSheetDefinitionIndex: number;
  onDeleteRedirectId: string | null;
  visible?: boolean;
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

const DataSheetDefinitionEditordd = ({
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
  const { data_sheet_definition_id, data_sheet_column_id } = useParams() as {
    data_sheet_definition_id: string | undefined;
    data_sheet_column_id: string | undefined;
  };

  const { focusedSheetIdx, focusedColumnIdx } = useStore(
    form.baseStore,
    ({ values }) => {
      const focusedSheetIdx = values.sheets.findIndex(
        ({ id }) => id.toString() === data_sheet_definition_id,
      );
      const focusedColumnIdx = values.sheets[focusedSheetIdx].columns.findIndex(
        ({ id }) => id.toString() === data_sheet_column_id,
      );
      return { focusedSheetIdx, focusedColumnIdx };
    },
  );

  const dataSheetDefinition = dataSetDefinition.sheets[focusedSheetIdx];

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
      <form.Field name="sheets" mode="array">
        {(field) =>
          field.state.value.map((sheet, index) => (
            <Fragment key={sheet.id}>
              <DataSheetDefinitionForm
                dataSheetDefinition={sheet}
                onDeleteRedirectId={"0"}
                form={form}
                fields={dataSheetDefinitionFields}
                dataSheetDefinitionIndex={index}
                visible={sheet.id.toString() === data_sheet_definition_id}
              />
              <DataSheetColumnDefinitionsEditor
                dataSheetDefinition={sheet}
                fields={dataSheetColumnDefinitionFields}
                columns={dataSheetColumnDefinitionColumns}
                form={form}
                dataSheetDefinitionIndex={index}
                visible={sheet.id.toString() === data_sheet_definition_id}
              />
            </Fragment>
          ))
        }
      </form.Field>
      {/* <DataSheetDefinitionForm
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
      /> */}
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

interface DataSheetDefinition {
  id: number;
  assay_model_id: number;
  assay_model_id__name: string;
  name: string;
  result?: boolean | null;
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
        console.log(JSON.stringify(ctx.issues));
        const firstAppearanceIndex = uniqueValues.get(item.safe_name);
        if (firstAppearanceIndex !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique ${ctx.issues.length}`,
            path: [idx, "safe_name"],
          });
          ctx.addIssue({
            code: "custom",
            message: `must be unique ${ctx.issues.length}`,
            path: [firstAppearanceIndex, "safe_name"],
          });
          return;
        }
        uniqueValues.set(item.safe_name, idx);
      });
    })
    .superRefine((items, ctx) => {
      const uniqueValues = new Map<string, number>();
      items.forEach((item, idx) => {
        const firstAppearanceIndex = uniqueValues.get(item.name);
        if (firstAppearanceIndex !== undefined) {
          ctx.addIssue({
            code: "custom",
            message: `must be unique`,
            path: [idx, "name"],
          });
          ctx.addIssue({
            code: "custom",
            message: `must be unique`,
            path: [firstAppearanceIndex, "name"],
          });
          return;
        }
        uniqueValues.set(item.name, idx);
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
            params: { clearOnRevalidate: true },
          });
          ctx.addIssue({
            code: "custom",
            message: `must be unique`,
            path: [firstAppearanceIndex, "name"],
            params: { clearOnRevalidate: true },
          });
          return;
        }
        uniqueValues.set(item.name, idx);
      });
    }),
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

  const {
    data: assayModelDataSheets,
    isLoading: isAssayModelDataSheetsLoading,
    isError: isAssayModelDataSheetsError,
    error: assayModelDataSheetsError,
  } = useAssayDataSheetDefinitions(assayModel.id);

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

  if (isDataTypesLoading || isAssayModelDataSheetsLoading) {
    return <Spinner />;
  }
  if (
    isDataTypesError ||
    !dataTypes ||
    isAssayModelDataSheetsError ||
    !assayModelDataSheets
  ) {
    return <ErrorPage error={dataTypesError ?? assayModelDataSheetsError} />;
  }

  return (
    <DataSheetDefinitionEditor
      dataSetDefinition={dataSetDefinition}
      assayModelDataSheets={assayModelDataSheets}
    />
  );
};

const DataSetDefinitionEditordddd = ({
  assayModel,
  dataSetDefinition,
}: {
  assayModel: AssayModelData;
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

  const {
    data: assayModelDataSheets,
    isLoading: isAssayModelDataSheetsLoading,
    isError: isAssayModelDataSheetsError,
    error: assayModelDataSheetsError,
  } = useAssayDataSheetDefinitions(assayModel.id);

  const createSheetDefinitionMutation =
    useCreateEntityMutation<AssayDataSheetDefinitionData>(
      "grit/assays/assay_data_sheet_definitions",
    );

  const createSheetColumnMutation =
    useCreateEntityMutation<AssayDataSheetColumnData>(
      "grit/assays/assay_data_sheet_columns",
    );

  const validationSchema = useMemo(
    () => DataSetDefinitionSchema(assayModelDataSheets ?? []),
    [assayModelDataSheets],
  );

  const form = useForm({
    defaultValues: dataSetDefinition,
    validators: {
      onChangeAsync: validationSchema,
      onMount: validationSchema,
    },

    onSubmit: async ({ value }) => {
      try {
        validationSchema.parse(value);
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
            sheet[name as keyof DataSheetDefinitionFull] as any,
            // { dontUpdateMeta: true },
          );
        });
        sheet.columns.forEach((column, j) => {
          dataSheetColumnDefinitionFields.forEach(({ name }) =>
            form.setFieldValue(
              `sheets[${i}].columns[${j}].${name}` as any,
              column[name as keyof DataSheetColumnDefinition] as any,
              // { dontUpdateMeta: true },
            ),
          );
        });
      });
      form.validateSync("change");
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
    isAssayModelDataSheetsLoading ||
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
    !dataTypes ||
    isAssayModelDataSheetsError ||
    !assayModelDataSheets
  )
    return (
      <ErrorPage
        error={
          dataSetDefinitionFieldsError ??
          dataSheetDefinitionFieldsError ??
          dataSheetColumnDefinitionFieldsError ??
          dataSheetColumnDefinitionColumnsError ??
          dataTypesError ??
          assayModelDataSheetsError
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
