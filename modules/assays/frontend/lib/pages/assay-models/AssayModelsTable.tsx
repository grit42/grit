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
  useAssayModelColumns,
  useInfinitePublishedAssayModels,
} from "../../queries/assay_models";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./assayModels.module.scss";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

const AssayModelsTable = () => {
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

  const tableState = useSetupTableState("assay-models-list", tableColumns);

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfinitePublishedAssayModels(tableState.sorting, tableState.filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      disableFooter
      className={styles.assayModelTable}
      onRowClick={(row) => navigate(row.original.id.toString())}
      tableState={tableState}
      header="Assay models"
      data={flatData}
      loading={isLoading}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0].total,
      }}
      noDataMessage={isError ? error : "No published assay models"}
    />
  );
};

export default AssayModelsTable;
