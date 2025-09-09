import { Button } from "@grit42/client-library/components";
import { Link, useNavigate } from "react-router-dom";
import {
  useAvailableDataTableEntities,
  useDataTableEntityColumns,
} from "../../queries/data_table_entities";
import { useTableColumns } from "@grit42/core/utils";
import { Row, Table, useSetupTableState } from "@grit42/table";
import { useCallback } from "react";
import { EntityData, useCreateEntityMutation } from "@grit42/core";
import { useQueryClient } from "@grit42/api";

const getRowId = (data: EntityData) => data.id.toString();

const DataTableEntitySelector = ({
  dataTableId,
}: {
  dataTableId: string | number;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: columns } = useDataTableEntityColumns(dataTableId);
  const tableColumns = useTableColumns<EntityData>(columns);
  const tableState = useSetupTableState(
    `data-table-${dataTableId}-available-entities`,
    tableColumns,
    {
      saveState: true,
      settings: {
        enableSelection: true,
      },
    },
  );

  const {
    data: availableDataTableEntities,
    isLoading: isAvailableDataTableEntitiesLoading,
    isError: isAvailableDataTableEntitiesError,
    error: availableDataTableEntitiesError,
  } = useAvailableDataTableEntities(
    dataTableId,
    tableState.sorting,
    tableState.filters,
  );

  const createEntityMutation = useCreateEntityMutation<EntityData>(
    "grit/assays/data_table_entities/create_bulk",
  );

  const onRowClick = (row: Row<EntityData>) => {
    tableState.setRowSelection((prev) => {
      if (prev[row.id]) {
        delete prev[row.id];
        return { ...prev };
      }
      return { ...prev, [row.id]: true };
    });
  };

  const onAdd = useCallback(
    async (selectedIds: string[]) => {
      await createEntityMutation.mutateAsync(
        selectedIds.map((entity_id) => ({
          data_table_id: dataTableId,
          entity_id,
        })),
      );
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "data",
            `grit/assays/data_tables/${dataTableId}/data_table_entities`,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "data",
            `grit/assays/data_tables/${dataTableId}/data_table_rows`,
          ],
        }),
      ]);
      navigate("..");
    },
    [createEntityMutation, dataTableId, navigate, queryClient],
  );

  console.log(tableState.rowSelection);
  console.log(tableState.selectAllState);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        margin: "auto",
        maxWidth: "100%",
        height: "100%",
      }}
    >
      <Table<EntityData>
        header="Select entities to add"
        getRowId={getRowId}
        onRowClick={onRowClick}
        headerActions={[
          <Button
            onClick={() => onAdd(Object.keys(tableState.rowSelection))}
            disabled={Object.keys(tableState.rowSelection).length == 0}
            color="secondary"
          >
            Add selected
          </Button>,
          <Link to="..">
            <Button color="primary">Cancel</Button>
          </Link>,
        ]}
        loading={isAvailableDataTableEntitiesLoading}
        tableState={tableState}
        disableFooter
        data={availableDataTableEntities}
        noDataMessage={
          (isAvailableDataTableEntitiesError
            ? availableDataTableEntitiesError
            : undefined) ?? "No more entities available"
        }
      />
    </div>
  );
};

export default DataTableEntitySelector;
