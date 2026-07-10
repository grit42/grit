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

import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import {
  AssayTypeData,
  useInfiniteAssayTypes,
} from "../../../queries/assay_types";

const ASSAY_TYPE_TABLE_COLUMNS: GritColumnDef<AssayTypeData>[] = [
  {
    accessorKey: "name",
    header: "Name",
    id: "name",
    type: "string",
    size: 200,
  },
  {
    accessorKey: "description",
    header: "Description",
    id: "description",
    type: "string",
    size: 750,
  },
];

const AssayTypesTable = () => {
  const navigate = useNavigate();

  const tableState = useSetupTableState("admin-assay_types-list", ASSAY_TYPE_TABLE_COLUMNS);

  const {
    data,
    isFetching,
    isFetchingNextPage,
    isError,
    error,
    fetchNextPage,
  } = useInfiniteAssayTypes(tableState.sorting, tableState.filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      header="Assay types"
      tableState={tableState}
      headerActions={<Link to="new"><Button>New</Button></Link>}
      data={flatData}
      onRowClick={(row) => navigate(`${row.original.id}`)}
      loading={isFetching}
      noDataMessage={isError ? error : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

export default AssayTypesTable;
