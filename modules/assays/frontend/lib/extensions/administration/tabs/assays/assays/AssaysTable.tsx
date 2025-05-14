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
import { useCallback, useEffect } from "react";
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useTableColumns } from "@grit42/core/utils";
import styles from "./assays.module.scss";
import { useAssayColumns, useAssays } from "../../../../../queries/assays";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const AssaysTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: assayColumns } = useAssayColumns(undefined, {
    select: (data) =>
      data.map((d) => ({
        ...d,
        defaultColumnSize:
          DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
      })),
  });

  const tableColumns = useTableColumns(assayColumns);

  const navigateToNew = useCallback(
    () => navigate("new"),
    [navigate, pathname],
  );

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New assay",
          onClick: navigateToNew,
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, pathname]);

  const tableState = useSetupTableState("admin-assays-list", tableColumns);

  const {
    data: assays,
    isLoading,
    isError,
    error,
  } = useAssays(tableState.sorting, tableState.filters);

  return (
    <div className={styles.container}>
      <Table
        header="Assays"
        loading={isLoading}
        tableState={tableState}
        headerActions={<Button onClick={navigateToNew}>New</Button>}
        className={styles.table}
        data={assays}
        onRowClick={(row) => navigate(`${row.original.id}`)}
        noDataMessage={isError ? error : undefined}
      />
    </div>
  );
};

const AssaysTableWrapper = () => {
  const {
    isLoading: isAssayColumnsLoading,
    isError: isAssayColumnsError,
    error: assayColumnsError,
  } = useAssayColumns();

  if (isAssayColumnsLoading) return <Spinner />;
  if (isAssayColumnsError) return <ErrorPage error={assayColumnsError} />;
  return <AssaysTable />;
};

export default AssaysTableWrapper;
