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
import {
  SynonymData,
  useInfiniteSynonymsOfCompound,
  useSynonymsColumns,
} from "../../../../queries/synonyms";
import { Table, useSetupTableState } from "@grit/table";
import { useToolbar } from "@grit/core/Toolbar";
import { useDestroySynonym } from "../../../../mutations/synonyms";
import Circle1NewIcon from "@grit/client-library/icons/Circle1New";
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

const CompoundSynonyms = ({ id }: Props) => {
  const canCrud = useHasRoles([
    "Administrator",
    "CompoundAdministrator",
    "CompoundUser",
  ]);

  const { data: columns } = useSynonymsColumns();
  const navigate = useNavigate();
  const registerToolbarActions = useToolbar();
  const { pathname } = useLocation();

  const destroySynonym = useDestroySynonym();

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
        requiredRoles: [
          "Administrator",
          "CompoundAdministrator",
          "CompoundUser",
        ],
      },
      actions: [
        {
          icon: <Circle1NewIcon />,
          id: "ADD_SYNONYM",
          label: "New synonym",
          requiredRoles: [
            "Administrator",
            "CompoundAdministrator",
            "CompoundUser",
          ],
          onClick: () =>
            navigate("/core/entities/Grit::Compounds::Synonym/new", {
              state: {
                redirect: pathname,
                title: `Create Synonym of ${compound?.name ?? "compound"}`,
                initialData: {
                  compound_id: id,
                },
              },
            }),
        },
      ],
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
      rowActions={canCrud ? ["delete"] : []}
      onRowClick={
        canCrud
          ? (row) =>
              navigate(
                `/core/entities/Grit::Compounds::Synonym/${row.original.id}`,
                {
                  state: {
                    redirect: pathname,
                    title: `Edit Synonym of ${compound?.name ?? "compound"}`,
                    initialData: {
                      compound_id: id,
                    },
                  },
                },
              )
          : undefined
      }
      onDelete={async (rows) => {
        if (
          !window.confirm(
            `Are you sure you want to delete this Compound? This action is irreversible`,
          )
        )
          return;
        await destroySynonym.mutateAsync(
          rows.map(({ original }) => original.id),
        );
      }}
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
