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
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useTableColumns } from "@grit42/core/utils";
import styles from "./assayTypes.module.scss";
import {
  useAssayTypeColumns,
  useInfiniteAssayTypes,
} from "../../../../queries/assay_types";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const AssayTypesTable = () => {
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: assayTypeColumns } = useAssayTypeColumns(undefined, {
    select: (data) =>
      data.map((d) => ({
        ...d,
        defaultColumnSize:
          DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
      })),
  });

  const tableColumns = useTableColumns(assayTypeColumns);

  const navigateToNew = useCallback(() => navigate("new"), [navigate]);

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New assay type",
          onClick: navigateToNew,
        },
      ],
    });
  }, [registerToolbarActions, navigateToNew, pathname]);

  const tableState = useSetupTableState("admin-assay_types-list", tableColumns);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteAssayTypes(tableState.sorting, tableState.filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      header="Assay types"
      tableState={tableState}
      headerActions={<Button onClick={navigateToNew}>New</Button>}
      className={styles.typesTable}
      data={flatData}
      onRowClick={(row) => navigate(`${row.original.id}`)}
      loading={isFetching}
      noDataMessage={isError ? error : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

const AssayTypesTableWrapper = () => {
  const {
    isLoading: isAssayTypeColumnsLoading,
    isError: isAssayTypeColumnsError,
    error: assayTypeColumnsError,
  } = useAssayTypeColumns();

  if (isAssayTypeColumnsLoading) return <Spinner />;
  if (isAssayTypeColumnsError)
    return <ErrorPage error={assayTypeColumnsError} />;
  return <AssayTypesTable />;
};

export default AssayTypesTableWrapper;
