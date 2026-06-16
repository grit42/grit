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

import { useMemo } from "react";
import { AssayDataSheetRecordData } from "../../../../queries/experiment_data_sheet_records";
import { useTableColumns } from "@grit42/core/utils";
import { Table, useSetupTableState } from "@grit42/table";
import { useAnalysisContext } from "../../../../features/analyses";
import { useInfiniteAnalysisRecords } from "../../../../features/analyses/queries";

const getRowId = (data: AssayDataSheetRecordData) => data.id.toString();

const DataPage = () => {
  const { properties, analysis } = useAnalysisContext();

  const tableColumns = useTableColumns<AssayDataSheetRecordData>(properties);

  const tableState = useSetupTableState<AssayDataSheetRecordData>(
    `analysis-data-${analysis.id}`,
    tableColumns,
  );

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteAnalysisRecords(
      analysis.id,
      tableState.sorting,
      tableState.filters,
    );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      getRowId={getRowId}
      tableState={tableState}
      data={flatData}
      loading={isLoading}
      noDataMessage={isError ? error : undefined}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

export default DataPage;
