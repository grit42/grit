/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/assays.
 *
 * @grit/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from "react";
import { useInfiniteEntityData, EntityData } from "@grit/core";
import { useNavigate } from "react-router-dom";
import { GritColumnDef, Table, useSetupTableState } from "@grit/table";
import { ErrorPage } from "@grit/client-library/components";
import { ExperimentData } from "../../../../queries/experiments";

const LOAD_SET_COLUMNS: GritColumnDef<EntityData>[] = [
  {
    accessorKey: "name",
    header: "Name",
    id: "name",
    type: "string",
    size: 150,
  },
  {
    accessorKey: "origin_id__name",
    header: "Origin",
    id: "origin_id__name",
    type: "entity",
    meta: {
      entity: {
        full_name: "Grit::Core::Origin",
        name: "Origin",
        path: "grit/core/origins",
        column: "origin_id",
        display_column: "name",
        display_column_type: "string",
        primary_key: "id",
        primary_key_type: "integer",
      },
    },
  },
  {
    accessorKey: "status_id__name",
    header: "Status",
    id: "status_id__name",
    type: "entity",
    meta: {
      entity: {
        full_name: "Grit::Core::Status",
        name: "Status",
        path: "grit/core/statuses",
        column: "status_id",
        display_column: "name",
        display_column_type: "string",
        primary_key: "id",
        primary_key_type: "integer",
      },
    },
  },
  {
    accessorKey: "item_count",
    header: "Items",
    id: "item_count",
    type: "integer",
    size: 150,
  },
  {
    accessorKey: "created_at",
    header: "Created at",
    id: "created_at",
    type: "datetime",
    size: 150,
  },
  {
    accessorKey: "created_by",
    header: "Created by",
    id: "created_by",
    size: 150,
    type: "entity",
    meta: {
      entity: {
        full_name: "Grit::Core::User",
        name: "User",
        path: "grit/core/users",
        column: "created_by",
        display_column: "name",
        display_column_type: "string",
        primary_key: "login",
        primary_key_type: "string",
      },
    },
  },
  {
    accessorKey: "updated_at",
    header: "Updated at",
    id: "updated_at",
    type: "datetime",
    size: 150,
  },
  {
    accessorKey: "updated_by",
    header: "Updated by",
    id: "updated_by",
    size: 150,
    type: "entity",
    meta: {
      entity: {
        full_name: "Grit::Core::User",
        name: "User",
        path: "grit/core/users",
        column: "updated_by",
        display_column: "name",
        display_column_type: "string",
        primary_key: "login",
        primary_key_type: "string",
      },
    },
  },
];

const ExperimentLoadSets = ({ experiment }: { experiment: ExperimentData }) => {
  const navigate = useNavigate();

  const tableState = useSetupTableState<EntityData>(
    `experiment-load-set-list`,
    LOAD_SET_COLUMNS,
    {
      saveState: true,
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
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
    "grit/core/load_sets",
    tableState.sorting,
    tableState.filters,
    {
      scope: "by_experiment",
      experiment_id: experiment.id,
    },
  );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <Table<EntityData>
      loading={isFetching && !isFetchingNextPage}
      data={flatData}
      tableState={tableState}
      onRowClick={(row) => navigate(`/core/load_sets/${row.original.id}`)}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

export default ExperimentLoadSets;
