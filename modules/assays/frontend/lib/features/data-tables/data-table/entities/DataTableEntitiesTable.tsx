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

import { Table, useSetupTableState } from "@grit42/table";
import styles from "./dataTableEntities.module.scss";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTableColumns } from "@grit42/core/utils";
import { useDestroyEntityMutation, useHasRoles } from "@grit42/core";
import {
  useDataTableEntities,
  useDataTableEntityColumns,
} from "../../queries/data_table_entities";
import { Button } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";

interface Props {
  dataTableId: string | number;
}

export const DataTableEntitiesTable = ({ dataTableId }: Props) => {
  const navigate = useNavigate();
  const canEditDataTable = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);

  const queryClient = useQueryClient();
  const destroyEntitiesMutation = useDestroyEntityMutation(
    "grit/assays/data_table_entities",
  );

  const { data: columns } = useDataTableEntityColumns(dataTableId);

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState(
    `data-table-entities-${dataTableId}`,
    tableColumns,
    {
      settings: {
        enableSelection: true,
      },
    },
  );

  const { data: rows, isLoading: isRowsLoading } = useDataTableEntities(
    dataTableId,
    tableState.sorting,
    tableState.filters,
    undefined,
    { enabled: dataTableId !== "new" },
  );

  const navigateToEdit = useCallback(() => navigate("edit"), [navigate]);

  return (
    <div className={styles.entitiesTableContainer}>
      {dataTableId !== "new" && (
        <Table
          header="Entities"
          tableState={tableState}
          rowActions={canEditDataTable ? ["delete"] : []}
          onDelete={async (rows) => {
            if (
              !window.confirm(
                `Are you sure you want to remove ${
                  rows.length > 1 ? `${rows.length} entities` : "this entity"
                }? This action is irreversible`,
              )
            )
              return;
            await destroyEntitiesMutation.mutateAsync(
              rows.map(({ original }) => original.data_table_entity_id),
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
          }}
          loading={isRowsLoading}
          headerActions={
            canEditDataTable ? (
              <Button disabled={dataTableId === "new"} onClick={navigateToEdit}>
                Add
              </Button>
            ) : undefined
          }
          data={rows ?? []}
        />
      )}
    </div>
  );
};

export default DataTableEntitiesTable;
