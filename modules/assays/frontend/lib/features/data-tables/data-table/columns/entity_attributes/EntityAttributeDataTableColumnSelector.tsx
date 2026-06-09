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

import { Button } from "@grit42/client-library/components";
import { createSearchParams, Link, useNavigate } from "react-router-dom";
import { useInfiniteAvailableEntityAttributes } from "../../../queries/data_table_columns";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { useMemo } from "react";
import { CenteredColumnLayout } from "@grit42/client-library/layouts";

const COLUMNS: GritColumnDef[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    type: "string",
  },
  {
    id: "safe_name",
    accessorKey: "safe_name",
    header: "Safe name",
    type: "string",
  },
];

const EntityAttributeDataTableColumnSelector = ({
  dataTableId,
}: {
  dataTableId: string | number;
}) => {
  const navigate = useNavigate();

  const availableTableState = useSetupTableState(
    "data-table-available-entity-attributes",
    COLUMNS,
    {
      saveState: {
        columnSizing: true,
      },
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
    },
  );

  const { data, isLoading, isError, error, isFetchingNextPage, fetchNextPage } =
    useInfiniteAvailableEntityAttributes(
      dataTableId,
      availableTableState.sorting,
      availableTableState.filters,
    );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <CenteredColumnLayout>
      <Table
        fitContent
        header="Select an attribute"
        onRowClick={(row) =>
          navigate({
            pathname: "../new",
            search: createSearchParams({
              entity_attribute_name: row.original.name.toString(),
              entity_attribute_safe_name: row.original.safe_name.toString(),
            }).toString(),
          })
        }
        headerActions={
          <Link to="..">
            <Button color="primary">Cancel</Button>
          </Link>
        }
        loading={isLoading}
        tableState={availableTableState}
        disableFooter
        data={flatData}
        noDataMessage={
          (isError ? error : undefined) ??
          "No attributes available for this source entity"
        }
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0]?.total,
        }}
      />
    </CenteredColumnLayout>
  );
};

export default EntityAttributeDataTableColumnSelector;
