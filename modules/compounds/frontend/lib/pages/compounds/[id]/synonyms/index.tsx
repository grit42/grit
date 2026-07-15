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

import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useCallback, useEffect, useMemo } from "react";
import { Link, useLocation, useMatch, useNavigate } from "react-router-dom";
import { useCompound } from "../../../../queries/compounds";
import {
  SynonymData,
  useInfiniteSynonymsOfCompound,
  useSynonymsColumns,
} from "../../../../queries/synonyms";
import { Table, useSetupTableState } from "@grit42/table";
import { useToolbar, useHasPermission } from "@grit42/core";
import { useTableColumns } from "@grit42/core/utils";
import { downloadFile } from "@grit42/client-library/utils";
import { getFilterParams, getSortParams, getURLParams } from "@grit42/api";

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

const CompoundSynonyms = ({ id }: Props) => {
  const canCrud = useHasPermission("write:compounds");

  const { data: columns } = useSynonymsColumns();
  const navigate = useNavigate();
  const registerToolbarActions = useToolbar();
  const { pathname } = useLocation();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState<any>("synonyms-list", tableColumns, {
    saveState: true,
    settings: {
      enableColumnDescription: true,
      enableColumnOrderReset: true,
    },
  });

  const { data: compound } = useCompound(id);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteSynonymsOfCompound(id, tableState.sorting, tableState.filters);

  const getRowId = useCallback((row: SynonymData) => row.id.toString(), []);

  const exportUrl = useMemo(() => {
    const columnIds = tableState.columnOrder.filter(
      (c) =>
        (tableState.columnVisibility[c] ?? true) &&
        !!tableColumns.find(({ id }) => c === id),
    );

    return getExportFileUrl(
      `/api/grit/compounds/synonyms`,
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
          id: "IMPORT_SYNONYMS",
          onClick: () =>
            navigate("/core/load_sets/new?entity=Grit::Compounds::Synonym"),
          text: "Import synonyms",
        },
      ],
      import: {
        requiredPermissions: ["write:compounds"],
      },
      export: {
        requiredPermissions: ["read:system"],
      },
      exportItems: [
        {
          id: "EXPORT_COMPOUNDS",
          onClick: async () => downloadFile(exportUrl),
          text: "Export compounds",
        },
      ],
    });
  }, [
    registerToolbarActions,
    id,
    pathname,
    navigate,
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
    <Table<SynonymData>
      loading={isFetching && !isFetchingNextPage}
      header="Synonyms"
      data={flatData}
      tableState={tableState}
      getRowId={getRowId}
      headerActions={
        canCrud ? (
          <Link to="new">
            <Button>New</Button>
          </Link>
        ) : undefined
      }
      onRowClick={canCrud ? (row) => navigate(row.id) : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

const CompoundSynonymsPage = () => {
  const match = useMatch("/compounds/:id/*");

  const {
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
  } = useSynonymsColumns();

  if (isColumnsLoading || isCompoundLoading) {
    return <Spinner />;
  }

  if (isColumnsError || isCompoundError) {
    return <ErrorPage error={columnsError ?? compoundError} />;
  }

  return <CompoundSynonyms id={match!.params.id!} />;
};

export default CompoundSynonymsPage;
