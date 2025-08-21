import { Button } from "@grit42/client-library/components";
import { Link } from "react-router-dom";
import {
  DataTableEntityData,
  useAvailableDataTableEntities,
  useDataTableEntities,
  useDataTableEntityColumns,
} from "../../queries/data_table_entities";
import { useTableColumns } from "@grit42/core/utils";
import { Row, Table, useSetupTableState } from "@grit42/table";
import { useCallback, useMemo } from "react";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
} from "@grit42/core";
import { useQueryClient } from "@grit42/api";

const getRowId = (data: DataTableEntityData) => data.id.toString();

const DataTableEntitySelector = ({
  dataTableId,
}: {
  dataTableId: string | number;
}) => {
  const queryClient = useQueryClient();
  const { data: columns } = useDataTableEntityColumns(dataTableId);
  const tableColumns = useTableColumns<DataTableEntityData>(columns);
  const availableTableState = useSetupTableState(
    "data-table-available-entities",
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
    "data-table-selected-entities",
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
    data: selectedDataTableEntities,
    isLoading: isSelectedDataTableEntitiesLoading,
    isError: isSelectedDataTableEntitiesError,
    error: selectedDataTableEntitiesError,
  } = useDataTableEntities(
    dataTableId,
    availableTableState.sorting,
    availableTableState.filters,
  );

  const {
    data: availableDataTableEntities,
    isLoading: isAvailableDataTableEntitiesLoading,
    isError: isAvailableDataTableEntitiesError,
    error: availableDataTableEntitiesError,
  } = useAvailableDataTableEntities(
    dataTableId,
    availableTableState.sorting,
    availableTableState.filters,
  );

  const dataTableEntitiesUrl = useMemo(
    () => `grit/assays/data_tables/${dataTableId}/data_table_entities`,
    [dataTableId],
  );

  const createEntityMutation =
    useCreateEntityMutation<DataTableEntityData>(dataTableEntitiesUrl);

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/data_table_entities",
  );

  const onAvailableRowClick = useCallback(
    async (row: Row<DataTableEntityData>) => {
      await createEntityMutation.mutateAsync({
        entity_id: row.id,
      });
      await queryClient.invalidateQueries({
        queryKey: ["entities", "data", dataTableEntitiesUrl],
      });
    },
    [createEntityMutation, dataTableEntitiesUrl, queryClient],
  );

  const onSelectedRowClick = useCallback(
    async (row: Row<DataTableEntityData>) => {
      await destroyEntityMutation.mutateAsync(
        (row.original as DataTableEntityData).data_table_entity_id,
      );
      await queryClient.invalidateQueries({
        queryKey: ["entities", "data", dataTableEntitiesUrl],
      });
    },
    [dataTableEntitiesUrl, destroyEntityMutation, queryClient],
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
        loading={isSelectedDataTableEntitiesLoading}
        tableState={selectedTableState}
        disableFooter
        data={selectedDataTableEntities}
        noDataMessage={
          (isSelectedDataTableEntitiesError
            ? selectedDataTableEntitiesError
            : undefined) ?? "No entities selected"
        }
      />
      <Table<DataTableEntityData>
        header="Available"
        getRowId={getRowId}
        onRowClick={onAvailableRowClick}
        headerActions={
          <Link to="..">
            <Button color="secondary">Done</Button>
          </Link>
        }
        loading={isAvailableDataTableEntitiesLoading}
        tableState={availableTableState}
        disableFooter
        data={availableDataTableEntities}
        noDataMessage={
          (isAvailableDataTableEntitiesError ? availableDataTableEntitiesError : undefined) ??
          "No more entities available"
        }
      />
    </div>
  );
};

export default DataTableEntitySelector;
