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
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { ExperimentDataSheetData } from "../../../../queries/experiment_data_sheet";
import {
  AssayDataSheetRecordData,
  ExperimentDataSheetRecordData,
  useExperimentDataSheetRecordColumns,
} from "../../../../queries/experiment_data_sheet_records";
import { useTableColumns } from "@grit42/core/utils";
import { Filter, Table, useSetupTableState } from "@grit42/table";
import styles from "./dataSheets.module.scss";
import { useInfiniteAssayModelDataSheetRecords } from "../../../../queries/assay_models";

const getRowId = (data: ExperimentDataSheetRecordData) => data.id.toString();

const ExperimentDataSheetRecords = ({
  dataSheet,
  metadataFilters,
}: {
  dataSheet: ExperimentDataSheetData;
  metadataFilters: Record<string, number[]>;
}) => {
  const navigate = useNavigate();
  const { data: columns } = useExperimentDataSheetRecordColumns(dataSheet.id);

  const tableColumns = useTableColumns<AssayDataSheetRecordData>(columns);

  const tableState = useSetupTableState<AssayDataSheetRecordData>(
    `data-sheet-assay-model-${dataSheet.id}`,
    tableColumns,
  );

  const filters = useMemo(
    () => {
      const filters = Object.keys(metadataFilters).map(
        (key): Filter => ({
          active: true,
          column: `emd_${key}`,
          id: `emd_${key}`,
          operator: "in_list",
          property: `emd_${key}`,
          property_type: "integer",
          type: "integer",
          value: metadataFilters[key],
        }),
      )
      return filters.concat(tableState.filters)
    },
    [metadataFilters, tableState.filters],
  );

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteAssayModelDataSheetRecords(
      dataSheet.id,
      tableState.sorting,
      filters,
    );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "1fr 1fr 1fr",
        gridTemplateColumns: "minmax(25%, 1fr)",
        gridAutoColumns: "25%",
        gridAutoFlow: "column",
        gap: "var(--spacing)",
        height: "100%",
        maxHeight: "100%",
        overflow: "auto",
      }}
    >
      <Table
        className={styles.table}
        getRowId={getRowId}
        tableState={tableState}
        onRowClick={
          ({ original }) => navigate(`/assays/experiments/${original.experiment_id}/sheets/${dataSheet.id}`)
        }
        data={flatData}
        loading={isLoading}
        noDataMessage={isError ? error : undefined}
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0]?.total,
        }}
      />
    </div>
  );
};

const DataSheet = ({
  dataSheets,
  metadataFilters,
}: {
  dataSheets: ExperimentDataSheetData[];
  metadataFilters: Record<string, number[]>;
}) => {
  const { sheet_id } = useParams() as {
    sheet_id: string;
  };
  const dataSheet = useMemo(
    () => dataSheets.find(({ id }) => sheet_id === id.toString()),
    [dataSheets, sheet_id],
  );

  const { data, isLoading, isError, error } =
    useExperimentDataSheetRecordColumns(
      dataSheet?.id ?? "",
      { with_experiment_id: true },
      {
        enabled: !!dataSheet,
      },
    );

  if (isLoading || !dataSheet) return <Spinner />;
  if (isError || !data)
    return (
      <ErrorPage error={error}>
        <Link to="../experiments">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );

  if (!dataSheet) {
    return <Navigate to=".." replace />;
  }

  return (
    <ExperimentDataSheetRecords
      dataSheet={dataSheet}
      metadataFilters={metadataFilters}
    />
  );
};

export default DataSheet;
