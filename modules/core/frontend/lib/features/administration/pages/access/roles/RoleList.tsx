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

import { useNavigate } from "react-router-dom";
import { useMemo } from "react";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { EntityData, useInfiniteEntityData } from "../../../../entities";
import { ErrorPage } from "@grit42/client-library/components";
import { CenteredColumnLayout } from "@grit42/client-library/layouts";

const ROLE_TABLE_COLUMNS: GritColumnDef<EntityData>[] = [
  {
    accessorKey: "name",
    header: "Name",
    id: "name",
    type: "string",
  },
  {
    accessorKey: "description",
    header: "Description",
    id: "description",
    type: "string",
    size: 500,
  },
];

export default function RolesList() {
  const navigate = useNavigate();
  const tableState = useSetupTableState<EntityData>(
    "admin-roles",
    ROLE_TABLE_COLUMNS,
    {
      saveState: true,
      settings: {
        disableColumnReorder: true,
      },
    },
  );

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteEntityData(
    "grit/core/roles",
    tableState.sorting,
    tableState.filters,
  );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <CenteredColumnLayout>
      <Table<EntityData>
        header="Roles"
        tableState={tableState}
        data={flatData}
        loading={isFetching && !isFetchingNextPage}
        onRowClick={(row) => navigate(row.original.id.toString())}
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0]?.total,
        }}
      />
    </CenteredColumnLayout>
  );
}
