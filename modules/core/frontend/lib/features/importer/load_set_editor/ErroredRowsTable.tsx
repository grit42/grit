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

import { useMemo } from "react";
import { GritColumnDef, Table } from "@grit42/table";
import { LoadSetData } from "../types";
import { useInfiniteLoadSetBlockErroredData } from "../queries";
import { useExportAction } from "./useExportAction";

const ErroredRowsTable = ({
  loadSet,
  columns,
}: {
  loadSet: LoadSetData;
  columns: { name: string; display_name: string | null }[];
}) => {
  const dataSetColumns = useMemo(() => {
    return [
      {
        accessorKey: "line",
        header: "Line",
        id: "index",
        type: "integer",
        size: 40,
      },
      ...columns
        .filter(({ display_name }) => display_name !== null)
        .map(
          ({ display_name, name }) =>
            ({
              header: display_name ?? name,
              id: name,
              type: "string",
              accessorKey: name,
            }) satisfies GritColumnDef,
        ),
    ];
  }, [columns]);

  const blockId = loadSet.load_set_blocks[0].id;

  useExportAction({
    exportId: "EXPORT_ERRORED_ROWS",
    exportText: "Export errored rows",
    endpoint: `/api/grit/core/load_set_blocks/${blockId}/export_errored_rows`,
  });

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteLoadSetBlockErroredData(blockId);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data.map((d) => d.datum)) ?? [],
    [data],
  );

  return (
    <Table
      columns={dataSetColumns}
      data={flatData}
      settings={{
        disableColumnReorder: true,
        disableColumnSorting: true,
        disableFilters: true,
        disableVisibilitySettings: true,
      }}
      loading={isLoading}
      noDataMessage={isError ? error : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0].total,
      }}
    />
  );
};

export default ErroredRowsTable;
