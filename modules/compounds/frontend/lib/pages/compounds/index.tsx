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

import { useCallback, useEffect, useMemo } from "react";
import {
  GritColumnDef,
  GritGroupColumnDef,
  Table,
  useColumnTypeDefs,
  useSetupTableState,
} from "@grit/table";
import {
  CompoundData,
  CompoundPropertyDef,
  CompoundTypeData,
  useCompoundGridMeta,
  useInfiniteCompounds,
} from "../../queries/compounds";
import { useNavigate } from "react-router-dom";
import styles from "./compounds.module.scss";
import { classnames, downloadFile } from "@grit/client-library/utils";
import { useLocalStorage } from "@grit/client-library/hooks";
import CompoundTypesSelector from "../../components/CompoundTypesSelector";
import { useEntityData, useDestroyEntityMutation } from "@grit/core";
import {
  getFilterParams,
  getSortParams,
  getURLParams,
  useQueryClient,
} from "@grit/api";
import { useToolbar } from "@grit/core/Toolbar";
import MoleculePlusIcon from "@grit/client-library/icons/MoleculePlus";
import { getTableColumns } from "@grit/core/utils";
import { ErrorPage, Spinner } from "@grit/client-library/components";

const useTableColumns = <T,>(columns: GritColumnDef<T>[]) => {
  const columnTypeDefs = useColumnTypeDefs();

  return useMemo(
    () =>
      columns.map((c) => {
        if (c.type && columnTypeDefs[c.type]?.column) {
          return {
            ...c,
            ...columnTypeDefs[c.type].column,
          } as GritColumnDef;
        }
        return c;
      }),
    [columns, columnTypeDefs],
  );
};

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

const CompoundsTable = () => {
  const navigate = useNavigate();
  const registerToolbarAction = useToolbar();
  const queryClient = useQueryClient();
  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/compounds/compounds",
  );

  const [selectedCompoundTypes, setSelectedCompoundTypes] = useLocalStorage<
    number[]
  >(`compound-grid_selectedCompoundTypes`, []);

  const { data: compoundTypes } = useEntityData<CompoundTypeData>(
    "grit/compounds/compound_types",
    [{ id: "id", desc: false }],
  );

  const { data: columnData } = useCompoundGridMeta();

  const columns = useMemo(() => columnData?.filter((d) => {
    if (!selectedCompoundTypes.length) return true;
    const has_structure = compoundTypes?.filter(({id}) => selectedCompoundTypes.includes(id)).some(
      ({ has_structure }) => has_structure,
    );
    if (["molecule","molweight","molformula","logp"].includes(d.name as string)) return has_structure;
    else if (d.compound_type_id === null) return true
    else if (selectedCompoundTypes?.includes(d.compound_type_id ?? -1)) return true;
    return false;
  }),[selectedCompoundTypes, columnData, compoundTypes])

  const tableColumns = useMemo(() => {
    const columnsByCompoundType = columns?.reduce(
      (acc, column) => {
        if (
          selectedCompoundTypes.length &&
          column.compound_type_id &&
          !selectedCompoundTypes.includes(column.compound_type_id)
        )
          return acc;
        if (!acc[column.compound_type_id__name ?? "base"]) {
          acc[column.compound_type_id__name ?? "base"] = [];
        }
        acc[column.compound_type_id__name ?? "base"].push(column);
        return acc;
      },
      {} as Record<string, CompoundPropertyDef[]>,
    );

    const groupedColumns: GritColumnDef<CompoundData>[] = [];
    for (const key in columnsByCompoundType) {
      if (key === "base") {
        groupedColumns.push(
          ...getTableColumns<CompoundData>(columnsByCompoundType[key]),
        );
      } else {
        groupedColumns.push({
          header: columnsByCompoundType[key][0].compound_type_id__name,
          columns: getTableColumns(columnsByCompoundType[key]),
        } as GritGroupColumnDef<CompoundData, unknown>);
      }
    }
    return groupedColumns;
  }, [columns, selectedCompoundTypes]);

  const tableState = useSetupTableState<any>(
    "compounds-list",
    useTableColumns(tableColumns),
    {
      saveState: true,
      settings: {
        enableColumnDescription: true,
        enableColumnOrderReset: true,
      },
    },
  );

  const exportUrl = useMemo(() => {
    const columnIds = tableState.columnOrder.filter(
      (c) =>
        (tableState.columnVisibility[c] ?? true) &&
        !!columns?.find(({ name }) => c === name),
    );

    return getExportFileUrl(
      `/api/grit/compounds/compounds`,
      [
        ...(selectedCompoundTypes.length
          ? [
              {
                active: true,
                column: "compound_type_id",
                property: "compound_type_id",
                property_type: "integer",
                id: "1",
                operator: "in_list",
                type: "integer",
                value: selectedCompoundTypes,
              },
            ]
          : []),
        ...(tableState.filters ?? []),
      ],
      tableState.sorting,
      columnIds,
    );
  }, [
    columns,
    tableState.filters,
    tableState.sorting,
    tableState.columnOrder,
    tableState.columnVisibility,
  ]);

  useEffect(() => {
    return registerToolbarAction({
      importItems: [
        {
          id: "IMPORT_COMPOUNDS",
          onClick: () =>
            navigate("/core/load_sets/new?entity=Grit::Compounds::Compound"),
          text: "Import compounds",
        },
        {
          id: "IMPORT_BATCHES",
          onClick: () =>
            navigate("/core/load_sets/new?entity=Grit::Compounds::Batch"),
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
          id: "NEW_COMPOUND",
          icon: <MoleculePlusIcon />,
          label: "Register compound",
          requiredRoles: [
            "Administrator",
            "CompoundAdministrator",
            "CompoundUser",
          ],
          items:
            compoundTypes?.map((t) => ({
              id: t.name,
              text: t.name,
              onClick: () =>
                navigate("/core/entities/Grit::Compounds::Compound/new", {
                  state: {
                    initialData: { compound_type_id: t.id },
                    redirectWithId: "/compounds",
                  },
                }),
            })) ?? [],
        },
      ],
    });
  }, [navigate, compoundTypes, registerToolbarAction, exportUrl]);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteCompounds(tableState.sorting, [
    ...tableState.filters,
    {
      active: selectedCompoundTypes.length > 0,
      column: "compound_type_id",
      id: "quick-compound-type-filter",
      operator: "in_list",
      property: "compound_type_id",
      property_type: "integer",
      type: "integer",
      value: selectedCompoundTypes,
    },
  ]);

  const getRowId = useCallback((row: CompoundData) => row.id.toString(), []);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <Table<CompoundData>
      className={classnames({
        [styles.withMolColumn]: !!columns?.find(
          (c) => (c.type as any) === "mol",
        ),
      })}
      loading={isFetching && !isFetchingNextPage}
      header="Compounds"
      leftHeaderActions={
        <CompoundTypesSelector
          options={
            compoundTypes?.map(({ id, name }) => ({
              id: id.toString(),
              label: name ?? id.toString(),
              value: id,
            })) ?? []
          }
          value={selectedCompoundTypes}
          onChange={setSelectedCompoundTypes}
        />
      }
      data={flatData}
      tableState={tableState}
      getRowId={getRowId}
      rowActions={["delete"]}
      onRowClick={(row) => navigate(row.original.id.toString())}
      onDelete={async (rows) => {
        if (
          !window.confirm(
            `Are you sure you want to delete ${rows.length > 1 ? `${rows.length} Compounds` : "this Compound"}? This action is irreversible`,
          )
        )
          return;
        await destroyEntityMutation.mutateAsync(
          rows.map(({ original }) => original.id),
        );
        await queryClient.invalidateQueries({
          queryKey: ["infiniteEntityData", "grit/compounds/compounds"],
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

const CompoundsPage = () => {
  const { data, isLoading, isError, error } = useCompoundGridMeta();
  const {
    data: compoundTypes,
    isLoading: isCompoundTypesLoading,
    isError: isCompoundTypesError,
    error: compoundTypesError,
  } = useEntityData<CompoundTypeData>("grit/compounds/compound_types", [
    { id: "id", desc: false },
  ]);

  if (isLoading || isCompoundTypesLoading) {
    return <Spinner />;
  }

  if (isError || !data || isCompoundTypesError || !compoundTypes) {
    return <ErrorPage error={error ?? compoundTypesError} />;
  }

  return <CompoundsTable />;
};

export default CompoundsPage;
