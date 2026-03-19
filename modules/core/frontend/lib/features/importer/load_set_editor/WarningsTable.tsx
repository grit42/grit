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
import { useInfiniteLoadSetBlockWarningData } from "../queries";
import { flattenWarningData } from "../utils/data";

const WARNING_COLUMNS: GritColumnDef[] = [
  {
    accessorKey: "line",
    header: "Line",
    id: "line",
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
    accessorKey: "warning",
    header: "Warning",
    id: "warning",
    type: "string",
    size: 500,
  },
];

const WarningsTable = ({ loadSet }: { loadSet: LoadSetData }) => {
  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteLoadSetBlockWarningData(loadSet.load_set_blocks[0].id);

  const flatData = useMemo(
    () => flattenWarningData(data?.pages),
    [data?.pages],
  );

  return (
    <Table
      columns={WARNING_COLUMNS}
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

export default WarningsTable;
