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
import { LoadSetBlockData } from "../../types/load_set_blocks";
import { useInfiniteLoadSetBlockErroredData } from "../../api/queries/load_set_blocks";
import { flattenErroredData } from "../../utils/data";
import { useExportAction } from "./useExportAction";

const ERROR_COLUMNS: GritColumnDef[] = [
  {
    accessorKey: "line",
    header: "Line",
    id: "index",
    type: "integer",
    size: 40,
  },
  {
    accessorKey: "column",
    header: "Column",
    id: "column",
    type: "string",
    size: 150,
  },
  {
    accessorKey: "value",
    header: "Value",
    id: "value",
    type: "string",
    size: 200,
  },
  {
    accessorKey: "error",
    header: "Error",
    id: "error",
    type: "string",
    size: 500,
  },
];

const ErrorsTable = ({
  loadSetBlock,
  columns,
}: {
  loadSetBlock: LoadSetBlockData;
  columns: { name: string; display_name: string | null }[];
}) => {
  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteLoadSetBlockErroredData(loadSetBlock.id);

  useExportAction({
    exportId: "EXPORT_ERRORS",
    exportText: "Export errors",
    endpoint: `/api/grit/core/load_set_blocks/${loadSetBlock.id}/export_errors`,
  });

  const flatData = useMemo(
    () => flattenErroredData(data?.pages, loadSetBlock.mappings, columns),
    [columns, data?.pages, loadSetBlock.mappings],
  );

  return (
    <Table
      columns={ERROR_COLUMNS}
      data={flatData}
      disableFooter
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

export default ErrorsTable;
