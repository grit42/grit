/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/assays.
 *
 * @grit/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { useCallback, useEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit/client-library/components";
import { useQueryClient } from "@grit/api";
import {
  EntityData,
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit/core";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit/form";
import { useToolbar } from "@grit/core/Toolbar";
import Circle1NewIcon from "@grit/client-library/icons/Circle1New";
import styles from "../../assayModels.module.scss";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumn,
  useAssayDataSheetColumnColumns,
  useAssayDataSheetColumnFields,
  useAssayDataSheetColumns,
} from "../../../../../../../queries/assay_data_sheet_columns";
import { Table, useSetupTableState } from "@grit/table";
import { useTableColumns } from "@grit/core/utils";

const initializedFormData = <T extends Partial<EntityData>>(
  data: T,
  fields: FormFieldDef[],
) => {
  return fields.reduce(
    (acc, f) =>
      f.type === "boolean" ? { ...acc, [f.name]: data[f.name] ?? false } : {...acc, [f.name]: data[f.name] },
    {},
  );
};

const AssayDataSheetColumnForm = ({
  fields,
  assayDataSheetColumn,
}: {
  fields: FormFieldDef[];
  assayDataSheetColumn: Partial<AssayDataSheetColumnData>;
}) => {
  const { sheet_id } = useParams() as { sheet_id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const createEntityMutation =
    useCreateEntityMutation<AssayDataSheetColumnData>(
      "grit/assays/assay_data_sheet_columns",
    );

  const editEntityMutation = useEditEntityMutation<AssayDataSheetColumnData>(
    "grit/assays/assay_data_sheet_columns",
    assayDataSheetColumn.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_data_sheet_columns",
  );

  const form = useForm<Partial<AssayDataSheetColumnData>>({
    defaultValues: initializedFormData(assayDataSheetColumn, fields),
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = {
        ...getVisibleFieldData<Partial<AssayDataSheetColumnData>>(
          formValue,
          fields,
        ),
        assay_data_sheet_definition_id: Number(sheet_id),
      };
      if (!assayDataSheetColumn.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as AssayDataSheetColumnData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/assay_data_sheet_columns",
            newEntity.id.toString(),
          ],
          newEntity,
        );
      } else {
        await editEntityMutation.mutateAsync(value as AssayDataSheetColumnData);
      }
      navigate("..");
    }),
  });

  const onDelete = async () => {
    if (
      !assayDataSheetColumn.id ||
      !window.confirm(
        `Are you sure you want to delete this column? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(assayDataSheetColumn.id);
    navigate("..");
  };

  return (
    <Surface className={styles.modelForm}>
      <h2 style={{ alignSelf: "baseline", marginBottom: "1em" }}>
        {assayDataSheetColumn.id ? "Edit" : "New"} column
      </h2>
      <Form<Partial<AssayDataSheetColumnData>> form={form}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridAutoRows: "max-content",
            gap: "calc(var(--spacing) * 2)",
            paddingBottom: "calc(var(--spacing) * 2)",
          }}
        >
          {form.state.errorMap.onSubmit && (
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: -1,
                color: "var(--palette-error-main)",
              }}
            >
              {form.state.errorMap.onSubmit?.toString()}
            </div>
          )}
          {fields.map((f) => (
            <FormField form={form} fieldDef={f} key={f.name} />
          ))}
        </div>
        <FormControls
          form={form}
          onDelete={onDelete}
          showDelete={!!assayDataSheetColumn.id}
          showCancel
          cancelLabel={assayDataSheetColumn.id ? "Back" : "Cancel"}
          onCancel={() => navigate("..")}
        />
      </Form>
    </Surface>
  );
};

const DataSheetColumn = () => {
  const { column_id } = useParams() as {
    column_id: string;
  };

  const {
    data: assayDataSheetColumn,
    isLoading: isAssayDataSheetColumnLoading,
    isError: isAssayDataSheetColumnError,
    error: assayDataSheetColumnError,
  } = useAssayDataSheetColumn(column_id);
  const {
    data: assayDataSheetColumnFields,
    isLoading: isAssayDataSheetColumnFieldsLoading,
    isError: isAssayDataSheetColumnFieldsError,
    error: assayDataSheetColumnFieldsError,
  } = useAssayDataSheetColumnFields(undefined, {
    select: (fields) =>
      fields.filter((f) => f.name !== "assay_data_sheet_definition_id"),
  });

  if (isAssayDataSheetColumnLoading || isAssayDataSheetColumnFieldsLoading)
    return <Spinner />;

  if (isAssayDataSheetColumnError || isAssayDataSheetColumnFieldsError) {
    return (
      <ErrorPage
        error={assayDataSheetColumnError ?? assayDataSheetColumnFieldsError}
      />
    );
  }

  return (
    <AssayDataSheetColumnForm
      fields={assayDataSheetColumnFields!}
      assayDataSheetColumn={assayDataSheetColumn!}
    />
  );
};

const DataSheetColumnsTable = ({ sheetId }: { sheetId: string }) => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: columns } = useAssayDataSheetColumnColumns();
  const tableColumns = useTableColumns(columns ?? []);

  const tableState = useSetupTableState("sheet-columns", tableColumns, {
    saveState: {
      columnSizing: true
    },
  });

  const { data, isLoading } = useAssayDataSheetColumns(
    sheetId,
    tableState.sorting,
    tableState.filters,
    undefined,
    { enabled: sheetId !== "new" },
  );

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW_COLUMN",
          icon: <Circle1NewIcon />,
          label: "New column",
          onClick: navigateToNew,
          disabled: sheetId === "new",
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew]);

  return (
    <>
      {sheetId !== "new" && (
        <Table
          header="Columns"
          tableState={tableState}
          loading={isLoading}
          headerActions={
            <Button disabled={sheetId === "new"} onClick={navigateToNew}>
              New
            </Button>
          }
          className={styles.typesTable}
          data={data ?? []}
          onRowClick={(row) => {
            queryClient.setQueryData(
              [
                "entities",
                "datum",
                "grit/assays/assay_data_sheet_columns",
                row.original.id.toString(),
              ],
              row.original,
            );
            navigate(row.original.id.toString());
          }}
        />
      )}
    </>
  );
};

const DataSheetColumns = () => {
  const { sheet_id } = useParams() as { sheet_id: string };
  const { data, isLoading, isError, error } = useAssayDataSheetColumnColumns();

  if (isLoading) {
    return <Spinner />;
  }

  if (isError) {
    return <ErrorPage error={error} />;
  }

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorPage error={error} />;
  return (
    <Routes>
      <Route index element={<DataSheetColumnsTable sheetId={sheet_id} />} />
      <Route path=":column_id" element={<DataSheetColumn />} />
      <Route path="*" element={<Navigate to="" replace />} />
    </Routes>
  );
};

export default DataSheetColumns;
