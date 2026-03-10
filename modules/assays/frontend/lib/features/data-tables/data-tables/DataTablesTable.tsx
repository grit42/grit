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
import { useCallback, useEffect, useMemo } from "react";
import { useHasRoles, useToolbar } from "@grit42/core";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorPage } from "@grit42/client-library/components";
import {
  useInfiniteDataTables,
  useDataTableColumns,
} from "../queries/data_tables";
import { useTableColumns } from "@grit42/core/utils";
import { CenteredColumnLayout } from "@grit42/client-library/layouts";

const DataTablesTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const canManageDataTable = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);
  const { pathname } = useLocation();
  const { data: dataTableColumns } = useDataTableColumns();

  const dataTableTableColumns = useTableColumns(dataTableColumns);

  const tableState = useSetupTableState(
    "data-tables-table",
    dataTableTableColumns,
    {
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
      initial: {
        sizing: {
          name: 200,
          description: 750,
        },
      },
    },
  );

  const { data, isLoading, isFetchingNextPage, isError, error, fetchNextPage } =
    useInfiniteDataTables(tableState.sorting, tableState.filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New Data Table",
          onClick: navigateToNew,
          disabled: !canManageDataTable,
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, pathname, canManageDataTable]);

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <CenteredColumnLayout>
      <Table
        tableState={tableState}
        header="Data Tables"
        headerActions={
          canManageDataTable ? (
            <Button onClick={navigateToNew}>New</Button>
          ) : undefined
        }
        fitContent
        data={flatData}
        onRowClick={(row) => navigate(`${row.original.id}`)}
        loading={isLoading}
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0]?.total,
        }}
      />
    </CenteredColumnLayout>
  );
};

export default DataTablesTable;
