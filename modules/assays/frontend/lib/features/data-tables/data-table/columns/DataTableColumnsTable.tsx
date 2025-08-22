/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { Table, useSetupTableState } from "@grit42/table";
import styles from "../dataTable.module.scss";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTableColumns } from "@grit42/core/utils";
import { useHasRoles } from "@grit42/core";
import { useSelectedDataTableColumns, useDataTableColumnColumns } from "../../queries/data_table_columns";
import { Button } from "@grit42/client-library/components";

interface Props {
  dataTableId: string | number;
}

export const DataTableColumnsTable = ({ dataTableId }: Props) => {
  const navigate = useNavigate();
  const canEditDataTable = useHasRoles(["Administrator", "AssayAdministrator", "AssayUser"])

  const { data: columns } = useDataTableColumnColumns();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState(`data-table-columns-${dataTableId}`, tableColumns);

  const { data: rows, isLoading: isRowsLoading } =
    useSelectedDataTableColumns(
      dataTableId,
      tableState.sorting,
      tableState.filters,
      undefined,
      { enabled: dataTableId !== "new" },
    );

  const navigateToEdit = useCallback(() => navigate("edit"), [navigate]);

  return (
    <>
      {dataTableId !== "new" && (
        <Table
          tableState={tableState}
          // header={canEditDataTable ? undefined : "Items"}
          loading={isRowsLoading}
          headerActions={
            canEditDataTable ? (
              <Button disabled={dataTableId === "new"} onClick={navigateToEdit}>
                Edit
              </Button>
            ) : undefined
          }
          className={styles.typesTable}
          data={rows ?? []}
        />
      )}
    </>
  );
};

export default DataTableColumnsTable;
