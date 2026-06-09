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

import {
  Filter,
  GritColumnDef,
  SortingState,
  Table,
  useSetupTableState,
} from "@grit42/table";
import styles from "./fullPerspectiveDialog.module.scss";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  PaginatedEndpointSuccess,
  UndefinedInitialDataInfiniteOptions,
  URLParams,
} from "@grit42/api";
import {
  EntityData,
  EntityProperties,
  useInfiniteEntityData,
} from "@grit42/core";
import {
  Dialog,
  DialogProps,
  ErrorPage,
} from "@grit42/client-library/components";

interface FullPerspectiveDialogProps extends Omit<DialogProps, "isOpen"> {
  column?: string;
  id?: string | number;
  columns: GritColumnDef<EntityData<EntityProperties>>[];
  dataTableId: string | number;
}

const useInfiniteDataTableRowFullPerspective = (
  dataTableRowId: number | string,
  dataTableId: number | string,
  columnSafeName: string,
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<PaginatedEndpointSuccess<any[]>, string>
  > = {},
) => {
  return useInfiniteEntityData<any>(
    `grit/assays/data_table_rows/${dataTableRowId}/full_perspective`,
    sort ?? [],
    filter ?? [],
    { ...params, data_table_id: dataTableId, column_safe_name: columnSafeName },
    queryOptions,
  );
};

const FullPerspectiveDialog = ({
  id,
  column,
  columns: columnsFromProps,
  dataTableId,
  ...props
}: FullPerspectiveDialogProps) => {
  const columns = useMemo(
    () => [
      ...columnsFromProps.filter(
        (c) =>
          c.meta?.data_table?.source_type === "entity_attribute" ||
          c.id === column,
      ),
      {
        header: "Experiment",
        id: "experiment_id__name",
        accessorKey: "experiment_id__name",
        type: "entity",
        default_hidden: false,
        required: false,
        unique: false,
        meta: {
          entity: {
            column: "experiment_id",
            full_name: "Grit::Assays::Experiment",
            name: "Experiment",
            path: "grit/assays/experiments",
            primary_key: "id",
            primary_key_type: "integer",
            display_column: "name",
            display_column_type: "string",
          },
        },
      },
    ],
    [columnsFromProps, column],
  );

  const columnFromProps = useMemo(
    () => columnsFromProps.find((c) => c.id === column),
    [columnsFromProps, column],
  );

  const tableState = useSetupTableState(`data-table-full-perspective`, columns);

  const navigate = useNavigate();

  const { data, isLoading, isFetchingNextPage, isError, error, fetchNextPage } =
    useInfiniteDataTableRowFullPerspective(
      id ?? -1,
      dataTableId,
      (columnFromProps?.type === "entity"
        ? columnFromProps?.meta?.entity?.column
        : column) ?? "",
      tableState.sorting,
      tableState.filters,
      undefined,
      { enabled: !!id },
    );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  if (isError) {
    return <ErrorPage error={error} />;
  }

  return (
    <Dialog
      isOpen={!!id}
      {...props}
      className={styles.fullPerspectiveDialog}
      title="Aggregated values"
    >
      <div className={styles.dialogContent}>
        <Table
          tableState={tableState}
          loading={isLoading}
          data={flatData ?? []}
          onRowClick={(row) =>
            navigate(
              `/assays/experiments/${row.original.experiment_id}/sheets/${row.original.assay_data_sheet_definition_id}`,
            )
          }
          pagination={{
            fetchNextPage,
            isFetchingNextPage,
            totalRows: data?.pages[0]?.total,
          }}
        />
      </div>
    </Dialog>
  );
};

export default FullPerspectiveDialog;
