import { Button } from "@grit42/client-library/components";
import { Link } from "react-router-dom";
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
  useCreateEntityMutation,
  useDestroyEntityMutation,
} from "@grit42/core";
import { useQueryClient } from "@grit42/api";

const getRowId = (data: DataTableColumnData) => data.id.toString();

const DataTableColumnSelector = ({
  dataTableId,
}: {
  dataTableId: string | number;
}) => {
  const queryClient = useQueryClient();
  const { data: columns } = useDataTableColumnColumns();
  const tableColumns = useTableColumns<DataTableColumnData>(columns);
  const availableTableState = useSetupTableState(
    "data-table-available-columns",
    tableColumns,
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

  const selectedTableState = useSetupTableState(
    "data-table-selected-columns",
    tableColumns,
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

  const createEntityMutation =
    useCreateEntityMutation<DataTableColumnData>(dataTableColumnsUrl);

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/data_table_columns",
  );

  const onAvailableRowClick = useCallback(
    async (row: Row<DataTableColumnData>) => {
      await createEntityMutation.mutateAsync({
        assay_data_sheet_column_id: row.id,
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "columns", "Grit::Assays::DataTableRow"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["entities", "data", dataTableColumnsUrl],
        }),
      ]);
    },
    [createEntityMutation, dataTableColumnsUrl, queryClient],
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
      <Table<DataTableColumnData>
        header="Available"
        getRowId={getRowId}
        onRowClick={onAvailableRowClick}
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
