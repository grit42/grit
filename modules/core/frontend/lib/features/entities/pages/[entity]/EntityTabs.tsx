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

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useEntity,
  useEntityColumns,
  useInfiniteEntityData,
} from "../../queries";
import { useLocation, useNavigate } from "react-router-dom";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
} from "../../mutations";
import {
  getFilterParams,
  getSortParams,
  getURLParams,
  useQueryClient,
} from "@grit42/api";
import Circle1New from "@grit42/client-library/icons/Circle1New";
import { Row } from "@grit42/table";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { EntityData, EntityInfo } from "../../types";
import { ErrorPage, Spinner, Tabs } from "@grit42/client-library/components";
import styles from "../entities.module.scss";
import { useToolbar } from "../../../../Toolbar";
import { useTableColumns } from "../../../../utils";
import { downloadFile } from "@grit42/client-library/utils";

const getExportFileUrl = (
  path: string,
  filters: any,
  sort: any,
  columns: string[],
) => {
  return `${path}/export?${getURLParams({
    ...getSortParams(sort ?? []),
    ...getFilterParams(filters ?? []),
    columns,
  })}`;
};

const EntityTabs = ({ entity }: { entity: string }) => {
  const pathname = useLocation().pathname;
  const { data, isLoading, isError, error } = useEntity(entity);
  const [selectedTab, setSelectedTab] = useState(0);

  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();

  useEffect(() => {
    return registerToolbarActions({
      importItems: [
        {
          id: "IMPORT",
          onClick: () => navigate(`/core/load_sets/new?entity=${entity}`),
          text: `Import ${entity}`,
        },
      ],
    });
  }, [entity, pathname, data, navigate, registerToolbarActions]);

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !data) {
    return <ErrorPage error={error} />;
  }

  return (
    <div
      style={{
        maxHeight: "100%",
        height: "100%",
        overflow: "auto",
        width: "100%",
      }}
    >
      <Tabs
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        className={styles.entityTabs}
        tabs={[
          {
            key: "records",
            name: "Records",
            panelProps: {
              style: {
                overflowY: "auto",
              },
            },
            panel: <EntityTableWrapper {...data} />,
          },
          {
            key: "load_sets",
            name: "Load sets",
            panelProps: {
              style: {
                overflowY: "auto",
              },
            },
            panel: <LoadSetTable {...data} />,
          },
        ]}
      />
    </div>
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

const LoadSetTable = ({ full_name, name }: EntityInfo) => {
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

const EntityTableWrapper = (props: EntityInfo) => {
  const { isLoading } = useEntityColumns(props.full_name);

  if (isLoading) {
    return <Spinner />;
  }

  return <EntityTable {...props} />;
};

const EntityTable = ({ full_name, path, name, plural }: EntityInfo) => {
  const pathname = useLocation().pathname;
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const registerToolbarActions = useToolbar();
  const cloneEntityMutation = useCreateEntityMutation(path);
  const destroyEntityMutation = useDestroyEntityMutation(path);

  const onRowClick = useCallback(
    (row: Row<EntityData>) =>
      navigate(`/core/entities/${full_name}/${row.original.id}`, {
        state: {
          redirect: pathname,
        },
      }),
    [navigate, pathname],
  );
  const {
    data: columns,
    isError: isColumnsError,
    error: columnsError,
  } = useEntityColumns(full_name);

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState<EntityData>(
    `${full_name}-list`,
    tableColumns,
    {
      saveState: true,
      settings: {
        enableSelection: true,
      },
    },
  );

  const exportUrl = useMemo(() => {
    const columnIds = tableState.columnOrder.filter(
      (c) =>
        (tableState.columnVisibility[c] ?? true) &&
        !!tableColumns.find(({ id }) => c === id),
    );

    return getExportFileUrl(
      `/api/${path}`,
      tableState.filters,
      tableState.sorting,
      columnIds,
    );
  }, [
    path,
    tableColumns,
    tableState.filters,
    tableState.sorting,
    tableState.columnOrder,
    tableState.columnVisibility,
  ]);

  useEffect(() => {
    return registerToolbarActions({
      exportItems: [
        {
          id: "EXPORT",
          onClick: async () => downloadFile(exportUrl),
          text: `Export ${plural}`,
        },
      ],
      actions: [
        {
          id: "NEW_ENTITY",
          icon: <Circle1New />,
          label: "New",
          onClick: () =>
            navigate(`/core/entities/${full_name}/new`, {
              state: {
                redirect: pathname,
              },
            }),
          requiredRoles: ["Administrator"],
        },
      ],
    });
  }, [
    name,
    full_name,
    path,
    plural,
    pathname,
    navigate,
    registerToolbarActions,
    exportUrl,
  ]);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteEntityData(path, tableState.sorting, tableState.filters);

  const getRowId = useCallback((row: EntityData) => row.id.toString(), []);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError || isColumnsError || !tableColumns.length) {
    return <ErrorPage error={error ?? columnsError} />;
  }

  return (
    <Table<EntityData>
      loading={isFetching && !isFetchingNextPage}
      header={name}
      data={flatData}
      tableState={tableState}
      onRowClick={onRowClick}
      getRowId={getRowId}
      rowActions={["delete", "clone"]}
      onClone={async (row) => {
        await cloneEntityMutation.mutateAsync(row.original);
        await queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", path],
        });
      }}
      onDelete={async (rows) => {
        if (
          !window.confirm(
            `Are you sure you want to delete ${rows.length} ${rows.length > 1 ? plural : name}? This action is irreversible`,
          )
        )
          return;
        await destroyEntityMutation.mutateAsync(
          rows.map(({ original }) => original.id),
        );
        await queryClient.invalidateQueries({
          queryKey: ["entities", "infiniteData", path],
        });
      }}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

export default EntityTabs;
