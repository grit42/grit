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
import { useTableColumns } from "@grit42/core/utils";
import {
  useAssayTypeColumns,
  useInfiniteAssayTypes,
} from "../../queries/assay_types";
import { useMemo } from "react";
import { EntityData } from "@grit42/core";

interface AssayTypesTableProps {
  state: [number[], React.Dispatch<React.SetStateAction<number[]>>];
}

const getRowId = (data: EntityData) => data.id.toString();

export const AssayTypesTable = ({ state }: AssayTypesTableProps) => {
  const [selectedTypes, setSelectedTypes] = state;
  const { data: columns } = useAssayTypeColumns(undefined, {
    select: (data) =>
      data
        .filter((c) => c.name === "name")
        .map((c) => ({ ...c, defaultColumnSize: 200 })),
  });

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("assay-types-list", tableColumns, {
    settings: {
      disableVisibilitySettings: true,
      disableFilters: true,
      disableColumnReorder: true,
    },
  });

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteAssayTypes(tableState.sorting);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  const emphasizedTypes = useMemo(
    () =>
      selectedTypes?.reduce(
        (acc, id) => ({ ...acc, [id.toString()]: true }),
        {},
      ),
    [selectedTypes],
  );

  return (
    <Table
      disableFooter
      header="Assay types"
      getRowId={getRowId}
      emphasizedRows={emphasizedTypes}
      onRowClick={(row, e) => {
        if (e.ctrlKey) {
          setSelectedTypes((prev) => {
            if (prev.includes(row.original.id))
              return prev.filter((id) => id !== row.original.id);
            return [...prev, row.original.id];
          });
        } else {
          setSelectedTypes((prev) => {
            if (prev.length === 1 && prev[0] === row.original.id) return [];
            return [row.original.id];
          });
        }
      }}
      tableState={tableState}
      data={flatData}
      loading={isLoading}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0].total,
      }}
      noDataMessage={isError ? error : undefined}
    />
  );
};

export default AssayTypesTable;
