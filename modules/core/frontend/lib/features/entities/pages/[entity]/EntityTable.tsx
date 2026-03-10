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

import { useCallback, useEffect, useMemo } from "react";
import { useEntityColumns, useInfiniteEntityData } from "../../queries";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
} from "../../mutations";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getFilterParams, getSortParams, getURLParams } from "@grit42/api";
import Circle1New from "@grit42/client-library/icons/Circle1New";
import { Row, Table, useSetupTableState } from "@grit42/table";
import { EntityData, EntityInfo } from "../../types";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useToolbar } from "../../../toolbar";
import { useTableColumns } from "../../../../utils";
import { downloadFile } from "@grit42/client-library/utils";
import { useHasRoles } from "../../../auth";
import { CenteredColumnLayout } from "@grit42/client-library/layouts";

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

export const EntityTableWrapper = (props: EntityInfo) => {
  const { isLoading } = useEntityColumns(props.full_name);

  if (isLoading) {
    return <Spinner />;
  }

  return <EntityTable {...props} />;
};

const EntityTable = ({ full_name, path, name, plural }: EntityInfo) => {
  const canCrud = useHasRoles(["Administrator"]);
  const pathname = useLocation().pathname;

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
    [full_name, navigate, pathname],
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
    <CenteredColumnLayout>
      <Table<EntityData>
        fitContent
        headerActions={
          canCrud ? (
            <Link
              to={`/core/entities/${full_name}/new`}
              state={{
                redirect: pathname,
              }}
            >
              <Button>New</Button>
            </Link>
          ) : undefined
        }
        loading={isFetching && !isFetchingNextPage}
        header={name}
        data={flatData}
        tableState={tableState}
        onRowClick={onRowClick}
        getRowId={getRowId}
        rowActions={["delete", "clone"]}
        onClone={async (row) => {
          await cloneEntityMutation.mutateAsync(row.original);
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
        }}
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0]?.total,
        }}
      />
    </CenteredColumnLayout>
  );
};

export default EntityTable;
