/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/compounds.
 *
 * @grit/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { ErrorPage, Spinner } from "@grit/client-library/components";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation, useMatch, useNavigate } from "react-router-dom";
import { useCompound } from "../../../../queries/compounds";
import { Table, useSetupTableState } from "@grit/table";
import { useToolbar } from "@grit/core/Toolbar";
import Circle1NewIcon from "@grit/client-library/icons/Circle1New";
import {
  BatchData,
  useCompoundTypeBatchesColumns,
  useInfiniteBatchesOfCompound,
} from "../../../../queries/batches";
import { useDestroyBatch } from "../../../../mutations/batches";
import { useTableColumns } from "@grit/core/utils";
import { downloadFile } from "@grit/client-library/utils";
import { getFilterParams, getSortParams, getURLParams } from "@grit/api";
import { useHasRoles } from "@grit/core";

interface Props {
  id: string;
}

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

const CompoundBatches = ({ id }: Props) => {
  const { data: compound } = useCompound(id);
  const { data: columns } = useCompoundTypeBatchesColumns(
    compound?.compound_type_id,
    {
      enabled: !!compound,
    },
  );

  const canCrud = useHasRoles([
    "Administrator",
    "CompoundAdministrator",
    "CompoundUser",
  ]);

  const navigate = useNavigate();
  const registerToolbarActions = useToolbar();
  const { pathname } = useLocation();

  const destroyBatch = useDestroyBatch();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState<any>("batches-list", tableColumns, {
    saveState: true,
    settings: {
      enableColumnDescription: true,
      enableColumnOrderReset: true,
    },
  });

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteBatchesOfCompound(id, tableState.sorting, tableState.filters);

  const getRowId = useCallback((row: BatchData) => row.id.toString(), []);

  const exportUrl = useMemo(() => {
    const columnIds = tableState.columnOrder.filter(
      (c) =>
        (tableState.columnVisibility[c] ?? true) &&
        !!tableColumns.find(({ id }) => c === id),
    );

    return getExportFileUrl(
      `/api/grit/compounds/batches`,
      [
        {
          active: true,
          column: "compound_id",
          property: "compound_id",
          property_type: "integer",
          id: "1",
          operator: "eq",
          type: "integer",
          value: id,
        },
        ...(tableState.filters ?? []),
      ],
      tableState.sorting,
      columnIds,
    );
  }, [
    id,
    tableColumns,
    tableState.filters,
    tableState.sorting,
    tableState.columnOrder,
    tableState.columnVisibility,
  ]);

  useEffect(() => {
    return registerToolbarActions({
      importItems: [
        {
          id: "IMPORT_BATCHES",
          onClick: () =>
            navigate(`/core/load_sets/new?entity=Grit::Compounds::Batch`),
          text: "Import batches",
        },
      ],
      import: {
        requiredRoles: [
          "Administrator",
          "CompoundAdministrator",
          "CompoundUser",
        ],
      },
      export: {
        requiredRoles: [
          "Administrator",
          "CompoundAdministrator",
          "CompoundUser",
        ],
      },
      exportItems: [
        {
          id: "EXPORT_COMPOUNDS",
          onClick: async () => downloadFile(exportUrl),
          text: "Export compounds",
        },
      ],
      actions: [
        {
          icon: <Circle1NewIcon />,
          id: "ADD_BATCH",
          label: "New batch",
          requiredRoles: [
            "Administrator",
            "CompoundAdministrator",
            "CompoundUser",
          ],
          onClick: () =>
            navigate("/core/entities/Grit::Compounds::Batch/new", {
              state: {
                redirect: pathname,
                initialData: {
                  compound_id: id,
                  compound_type_id: compound?.compound_type_id,
                },
                title: `Create Batch of ${compound?.name ?? "compound"}`,
              },
            }),
        },
      ],
    });
  }, [
    registerToolbarActions,
    id,
    pathname,
    navigate,
    compound?.compound_type_id,
    compound?.name,
    exportUrl,
  ]);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <Table<BatchData>
      loading={isFetching && !isFetchingNextPage}
      header="Batches"
      data={flatData}
      tableState={tableState}
      getRowId={getRowId}
      rowActions={canCrud ? ["delete"] : undefined}
      onRowClick={
        canCrud
          ? (row) =>
              navigate(
                `/core/entities/Grit::Compounds::Batch/${row.original.id}`,
                {
                  state: {
                    redirect: pathname,
                    initialData: {
                      compound_id: id,
                      compound_type_id: compound?.compound_type_id,
                    },
                    title: `Edit Batch of ${compound?.name ?? "compound"}`,
                  },
                },
              )
          : undefined
      }
      onDelete={async (rows) => {
        if (
          !window.confirm(
            `Are you sure you want to delete ${rows.length > 1 ? `${rows.length} Batches` : "this Batch"}? This action is irreversible`,
          )
        )
          return;
        await destroyBatch.mutateAsync(rows.map(({ original }) => original.id));
      }}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

const CompoundBatchesPage = () => {
  const match = useMatch("/compounds/:id/*");

  const {
    data: compound,
    isLoading: isCompoundLoading,
    isError: isCompoundError,
    error: compoundError,
  } = useCompound(match!.params.id!, undefined, {
    enabled: !!match?.params.id,
  });

  const {
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
  } = useCompoundTypeBatchesColumns(compound?.compound_type_id, {
    enabled: !!compound,
  });

  if (isColumnsLoading || isCompoundLoading) {
    return <Spinner />;
  }

  if (isColumnsError || isCompoundError) {
    return <ErrorPage error={columnsError ?? compoundError} />;
  }

  return <CompoundBatches id={match!.params.id!} />;
};

export default CompoundBatchesPage;
