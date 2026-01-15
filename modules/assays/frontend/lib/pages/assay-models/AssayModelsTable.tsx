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

import { Filter, Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import {
  useAssayModelColumns,
  useInfinitePublishedAssayModels,
} from "../../queries/assay_models";
import { useMemo } from "react";
import { EntityData, useHasRoles } from "@grit42/core";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";

const getRowId = (data: EntityData) => data.id.toString();

interface AssayModelsTableProps {
  selectedTypes?: number[];
}

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const AssayModelsTable = ({ selectedTypes }: AssayModelsTableProps) => {
  const canCrud = useHasRoles(["Administrator", "AssayAdministrator"]);
  const navigate = useNavigate();

  const { data: columns } = useAssayModelColumns(undefined, {
    select: (data) =>
      data.map((d) => ({
        ...d,
        defaultColumnSize:
          DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
      })),
  });

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("assay-models-list", tableColumns, {
    settings: {
      disableVisibilitySettings: true,
      disableColumnReorder: true,
    },
  });

  const filters = useMemo(
    (): Filter[] => [
      ...tableState.filters,
      {
        active: !!selectedTypes?.length,
        id: "assay_type_id",
        column: "assay_type_id",
        operator: "in_list",
        property: "assay_type_id",
        property_type: "integer",
        type: "integer",
        value: selectedTypes,
      },
    ],
    [tableState.filters, selectedTypes],
  );

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfinitePublishedAssayModels(tableState.sorting, filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      disableFooter
      header="Assay models"
      getRowId={getRowId}
      headerActions={
        canCrud && (
          <Link to="/assays/assay-models/settings/assay-models">
            <Button>Manage assay models</Button>
          </Link>
        )
      }
      onRowClick={(row) => navigate(row.id)}
      tableState={tableState}
      data={flatData}
      loading={isLoading}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0].total,
      }}
      noDataMessage={
        isError
          ? error
          : selectedTypes?.length
          ? "No models for the selected types"
          : "No published assay models"
      }
    />
  );
};

export default AssayModelsTable;
