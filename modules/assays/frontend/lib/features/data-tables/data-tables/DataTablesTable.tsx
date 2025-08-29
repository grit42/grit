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

import { Table } from "@grit42/table";
import { useCallback, useEffect } from "react";
import { useHasRoles } from "@grit42/core";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import {
  useDataTables,
  useDataTableColumns,
} from "../queries/data_tables";
import styles from "./dataTables.module.scss";
import { useToolbar } from "@grit42/core/Toolbar";
import { useTableColumns } from "@grit42/core/utils";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const DataTablesTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const canManageDataTable = useHasRoles(["Administrator", "AssayAdministrator", "AssayUser"])
  const { pathname } = useLocation();
  const { data: dataTables } = useDataTables();
  const { data: dataTableColumns } = useDataTableColumns(undefined, {
    select: (data) =>
      data.map((d) => ({
        ...d,
        defaultColumnSize:
          DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
      })),
  });

  const dataTableTableColumns = useTableColumns(dataTableColumns);

  const navigateToNew = useCallback(
    () => navigate("new"),
    [navigate],
  );

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New Data Table",
          onClick: navigateToNew,
          disabled: canManageDataTable
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, pathname, canManageDataTable]);

  return (
    <div className={styles.dataTables}>
      <Table
        header="Data Tables"
        settings={{
          disableColumnReorder: true,
          disableVisibilitySettings: true,
        }}
        headerActions={canManageDataTable ? <Button onClick={navigateToNew}>New</Button> : undefined}
        className={styles.typesTable}
        data={dataTables}
        columns={dataTableTableColumns}
        onRowClick={(row) => navigate(`${row.original.id}`)}
      />
    </div>
  );
};

export default DataTablesTable;
