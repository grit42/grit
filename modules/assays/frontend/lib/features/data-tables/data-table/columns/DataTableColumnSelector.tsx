import { Button } from "@grit42/client-library/components";
import { createSearchParams, Link, useNavigate } from "react-router-dom";
import {
  DataTableColumnData,
  useAvailableDataTableColumns,
  useDataTableColumnColumns,
  useSelectedDataTableColumns,
} from "../../queries/data_table_columns";
import { useTableColumns } from "@grit42/core/utils";
import { Row, Table, useSetupTableState } from "@grit42/table";
import { useCallback, useMemo } from "react";
import {
  useDestroyEntityMutation,
} from "@grit42/core";
import { useQueryClient } from "@grit42/api";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumnColumns,
} from "../../../../queries/assay_data_sheet_columns";

const getRowId = (data: DataTableColumnData | AssayDataSheetColumnData) =>
  data.id.toString();

const DataTableColumnSelector = ({
  dataTableId,
}: {
  dataTableId: string | number;
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: dataTableColumnColumns } = useDataTableColumnColumns();
  const selectedTableColumns = useTableColumns<DataTableColumnData>(
    dataTableColumnColumns,
  );
  const selectedTableState = useSetupTableState(
    "data-table-selected-columns",
    selectedTableColumns,
    {
      saveState: {
        columnSizing: true,
      },
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
    },
  );
  const {
    data: selectedDataTableColumns,
    isLoading: isSelectedDataTableColumnsLoading,
    isError: isSelectedDataTableColumnsError,
    error: selectedDataTableColumnsError,
  } = useSelectedDataTableColumns(
    dataTableId,
    selectedTableState.sorting,
    selectedTableState.filters,
  );

  const { data: dataSheetColumnColumns } = useAssayDataSheetColumnColumns();
  const availableTableColumns = useTableColumns<AssayDataSheetColumnData>(
    dataSheetColumnColumns,
  );
  const availableTableState = useSetupTableState(
    "data-table-available-columns",
    availableTableColumns,
    {
      saveState: {
        columnSizing: true,
      },
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
    },
  );
  const {
    data: availableDataTableColumns,
    isLoading: isAvailableDataTableColumnsLoading,
    isError: isAvailableDataTableColumnsError,
    error: availableDataTableColumnsError,
  } = useAvailableDataTableColumns(
    dataTableId,
    availableTableState.sorting,
    availableTableState.filters,
  );

  const dataTableColumnsUrl = useMemo(
    () => `grit/assays/data_tables/${dataTableId}/data_table_columns`,
    [dataTableId],
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/data_table_columns",
  );

  const onSelectedRowClick = useCallback(
    async (row: Row<DataTableColumnData>) => {
      await destroyEntityMutation.mutateAsync(
        (row.original as DataTableColumnData).id,
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "columns", "Grit::Assays::DataTableRow"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", dataTableColumnsUrl],
        }),
      ]);
    },
    [dataTableColumnsUrl, destroyEntityMutation, queryClient],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "calc(var(--spacing) * 2 )",
        width: "100%",
        height: "100%",
      }}
    >
      <Table
        header="Selected"
        getRowId={getRowId}
        onRowClick={onSelectedRowClick}
        loading={isSelectedDataTableColumnsLoading}
        tableState={selectedTableState}
        disableFooter
        data={selectedDataTableColumns}
        noDataMessage={
          (isSelectedDataTableColumnsError
            ? selectedDataTableColumnsError
            : undefined) ?? "No columns selected"
        }
      />
      <Table<AssayDataSheetColumnData>
        header="Available"
        getRowId={getRowId}
        onRowClick={(row) =>
          navigate({
            pathname: "new",
            search: createSearchParams({
              assay_data_sheet_column_id: row.original.id.toString(),
            }).toString(),
          })
        }
        headerActions={
          <Link to="..">
            <Button color="secondary">Done</Button>
          </Link>
        }
        loading={isAvailableDataTableColumnsLoading}
        tableState={availableTableState}
        disableFooter
        data={availableDataTableColumns}
        noDataMessage={
          (isAvailableDataTableColumnsError
            ? availableDataTableColumnsError
            : undefined) ?? "No more columns available"
        }
      />
    </div>
  );
};

export default DataTableColumnSelector;
