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
import styles from "./dataTableEntities.module.scss";

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

  return (
    <div className={styles.entitiesTableContainer}>
      <Table<EntityData>
        header="Select entities to add"
        getRowId={getRowId}
        onRowClick={onRowClick}
        headerActions={[
          <Button
            key="add"
            onClick={() => {onAdd(Object.keys(tableState.rowSelection))}}
            disabled={createEntityMutation.isPending}
            loading={createEntityMutation.isPending}
            color="secondary"
          >
            Add selected
          </Button>,
          <Link to="..">
            <Button color="primary" key="cancel">
              Cancel
            </Button>
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
