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

import { Row, Table, useSetupTableState } from "@grit42/table";
import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTableColumns } from "@grit42/core/utils";
import { useDestroyEntityMutation, useHasRoles } from "@grit42/core";
import {
  useDataTableColumnColumns,
  DataTableColumnData,
  useInfiniteSelectedEntityAttributeDataTableColumns,
} from "../../../queries/data_table_columns";
import { Button } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { CenteredColumnLayout } from "@grit42/client-library/layouts";

interface Props {
  dataTableId: string | number;
}

const EntityAttributeDataTableColumnsTable = ({ dataTableId }: Props) => {
  const navigate = useNavigate();
  const canEditDataTable = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);

  const queryClient = useQueryClient();
  const destroyColumnsMutation = useDestroyEntityMutation(
    "grit/assays/data_table_columns",
  );

  const { data: columns } = useDataTableColumnColumns(undefined, {
    select: (data) =>
      data.filter(
        ({ name }) =>
          ![
            "source_type",
            "experiment_ids",
            "metadata_filters",
            "assay_data_sheet_column_id__name",
            "data_table_id__name",
            "aggregation_method",
            "sort",
          ].includes(name as string),
      ),
  });

  const tableColumns = useTableColumns<DataTableColumnData>(columns);

  const tableState = useSetupTableState(
    `data-table-assay-data-sheet-columns-${dataTableId}`,
    tableColumns,
    {
      settings: {
        enableSelection: true,
      },
    },
  );

  const { data, isLoading, isError, error, isFetchingNextPage, fetchNextPage } =
    useInfiniteSelectedEntityAttributeDataTableColumns(
      dataTableId,
      tableState.sorting,
      tableState.filters,
      undefined,
      { enabled: dataTableId !== "new" },
    );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  const navigateToSelect = useCallback(() => navigate("select"), [navigate]);
  const navigateToEdit = useCallback(
    (row: Row<DataTableColumnData>) => navigate(row.original.id.toString()),
    [navigate],
  );

  return (
    <CenteredColumnLayout>
      <Table
        tableState={tableState}
        onRowClick={navigateToEdit}
        rowActions={canEditDataTable ? ["delete"] : []}
        onDelete={async (rows) => {
          if (
            !window.confirm(
              `Are you sure you want to remove ${
                rows.length > 1 ? `${rows.length} columns` : "this column"
              }? This action is irreversible`,
            )
          )
            return;
          await destroyColumnsMutation.mutateAsync(
            rows.map(({ original }) => original.id),
          );
          await Promise.all([
            queryClient.invalidateQueries({
              queryKey: ["entities", "columns", "Grit::Assays::DataTableRow"],
            }),
            queryClient.invalidateQueries({
              queryKey: [
                "entities",
                "data",
                `grit/assays/data_tables/${dataTableId}/data_table_columns`,
              ],
            }),
            queryClient.invalidateQueries({
              queryKey: [
                "entities",
                "infiniteData",
                `grit/assays/data_tables/${dataTableId}/data_table_rows`,
              ],
            }),
          ]);
        }}
        loading={isLoading}
        headerActions={
          canEditDataTable ? (
            <Button disabled={dataTableId === "new"} onClick={navigateToSelect}>
              Add entity attribute
            </Button>
          ) : undefined
        }
        data={flatData ?? []}
        noDataMessage={isError ? error : undefined}
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0]?.total,
        }}
      />
    </CenteredColumnLayout>
  );
};

export default EntityAttributeDataTableColumnsTable;
