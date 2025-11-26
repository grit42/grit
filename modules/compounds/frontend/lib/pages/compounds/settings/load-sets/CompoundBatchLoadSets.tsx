/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { useEffect, useMemo, useState } from "react";
import { useInfiniteEntityData, EntityData } from "@grit42/core";
import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useMatch,
  useNavigate,
} from "react-router-dom";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { ErrorPage, Tabs } from "@grit42/client-library/components";

const TABS = [
  {
    url: "compound",
    label: "Compound",
  },
  {
    url: "batch",
    label: "Batch",
  },
];

const CompoundBatchLoadSets = () => {
  const navigate = useNavigate();

  const match = useMatch(
    "/compounds/settings/load-sets/:childPath/*",
  );
  const childPath = match?.params.childPath ?? "metadata";

  const [selectedTab, setSelectedTab] = useState(
    TABS.findIndex(({ url }) => childPath === url),
  );

  useEffect(() => {
    setSelectedTab(TABS.findIndex(({ url }) => childPath === url));
  }, [childPath]);

  const handleTabChange = (index: number) => {
    navigate(TABS[index].url);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        height: "100%",
        overflow: "auto",
      }}
    >
      <Tabs
        onTabChange={handleTabChange}
        selectedTab={selectedTab}
        tabs={TABS.map((t) => ({
          key: t.url,
          name: t.label,
          panel: <></>,
        }))}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          width: "100%",
          height: "100%",
          maxWidth: "100%",
          maxHeight: "100%",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
};

const CompoundBatchLoadSetsPage = () => {
  return (
    <Routes>
      <Route element={<CompoundBatchLoadSets />}>
        <Route
          path="/compound"
          element={
            <LoadSetTable
              name="Compound"
              full_name="Grit::Compounds::Compound"
            />
          }
        />
        <Route
          path="/batch"
          element={
            <LoadSetTable name="Batch" full_name="Grit::Compounds::Batch" />
          }
        />
        <Route path="*" element={<Navigate to="compound" />} />
      </Route>
    </Routes>
  );
};

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

const LoadSetTable = ({
  full_name,
  name,
}: {
  full_name: string;
  name: string;
}) => {
  const navigate = useNavigate();

  const tableState = useSetupTableState<EntityData>(
    `${full_name}-list`,
    LOAD_SET_COLUMNS,
    {
      saveState: true,
      settings: {
        enableSelection: true,
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
      scope: "by_entity",
      entity: full_name,
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
      header={`${name} load sets`}
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

export default CompoundBatchLoadSetsPage;
