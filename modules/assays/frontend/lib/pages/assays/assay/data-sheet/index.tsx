/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit/assays.
 *
 * @grit/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit/assays. If not, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit/client-library/components";
import {
  AssayDataSheetRecordData,
  ExperimentDataSheetRecordData,
  useExperimentDataSheetRecordColumns,
  useInfiniteAssayDataSheetDefinitionRecords,
} from "../../../../queries/experiment_data_sheet_records";
import { useTableColumns } from "@grit/core/utils";
import { Table, useSetupTableState } from "@grit/table";
import styles from "./dataSheet.module.scss";
import { AssayDataSheetDefinitionData } from "../../../../queries/assay_data_sheet_definitions";
import { EntityPropertyDef } from "@grit/core";

const getRowId = (data: ExperimentDataSheetRecordData) => data.id.toString();

const AssayDataSheetRecords = ({
  dataSheet,
}: {
  dataSheet: AssayDataSheetDefinitionData;
}) => {
  const navigate = useNavigate();
  const { data: columns } = useExperimentDataSheetRecordColumns(
    dataSheet.id,
    undefined,
    {
      select: (data) => [
        {
          name: "experiment_id__name",
          type: "entity",
          display_name: "Experiment",
          entity: {
            column: "experiment_id",
            display_column: "name",
            display_column_type: "string",
            full_name: "Grit::Assays::Experiment",
            name: "Experiment",
            path: "grit/assays/experiments",
            primary_key: "id",
            primary_key_type: "integer",
          },
        } as EntityPropertyDef,
        ...data,
      ],
    },
  );

  const tableColumns = useTableColumns<AssayDataSheetRecordData>(columns);

  const tableState = useSetupTableState<AssayDataSheetRecordData>(
    `data-sheet-${dataSheet.id}`,
    tableColumns,
  );
  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteAssayDataSheetDefinitionRecords(
      dataSheet.id,
      tableState.sorting,
      tableState.filters,
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
        onRowClick={({ original }) =>
          navigate(
            `/assays/experiments/${original.experiment_id}/sheets/${original.experiment_data_sheet_id}`,
          )
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

const AssayDataSheet = ({
  dataSheets,
}: {
  dataSheets: AssayDataSheetDefinitionData[];
}) => {
  const { sheet_id } = useParams() as { sheet_id: string };

  const dataSheet = useMemo(
    () => dataSheets.find(({ id }) => sheet_id === id.toString()),
    [dataSheets, sheet_id],
  );

  const { data, isLoading, isError, error } =
    useExperimentDataSheetRecordColumns(dataSheet?.id ?? "", undefined, {
      enabled: !!dataSheet,
    });

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

  return <AssayDataSheetRecords dataSheet={dataSheet} />;
};

export default AssayDataSheet;
