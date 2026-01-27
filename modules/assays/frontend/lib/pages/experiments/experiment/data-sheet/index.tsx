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

import { useEffect, useMemo } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { ExperimentDataSheetData } from "../../../../queries/experiment_data_sheet";
import {
  ExperimentDataSheetRecordData,
  useExperimentDataSheetRecordColumns,
  useInfiniteExperimentDataSheetRecords,
} from "../../../../queries/experiment_data_sheet_records";
import { useTableColumns } from "@grit42/core/utils";
import { Table, useSetupTableState } from "@grit42/table";
import ExperimentDataSheetRecordFormWrapper from "./RecordForm";
import { useToolbar } from "@grit42/core/Toolbar";
import styles from "./dataSheet.module.scss";
import { useHasRoles } from "@grit42/core";
import { ExperimentData, useExperiment } from "../../../../queries/experiments";

const getRowId = (data: ExperimentDataSheetRecordData) => data.id.toString();

const ExperimentDataSheetRecords = ({
  dataSheet,
  experiment,
}: {
  dataSheet: ExperimentDataSheetData;
  experiment: ExperimentData;
}) => {
  const { experiment_id } = useParams() as { experiment_id: string };
  const canCrudRecord = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]) && experiment.publication_status_id__name !== "Published";
  const registerToolbarAction = useToolbar();
  const navigate = useNavigate();
  const { data: columns } = useExperimentDataSheetRecordColumns(dataSheet.id);

  const tableColumns = useTableColumns<ExperimentDataSheetRecordData>(columns);

  const tableState = useSetupTableState<ExperimentDataSheetRecordData>(
    `data-sheet-${dataSheet.id}`,
    tableColumns,
  );
  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteExperimentDataSheetRecords(
      experiment_id,
      dataSheet.id,
      tableState.sorting,
      tableState.filters,
    );

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  useEffect(
    () =>
      registerToolbarAction({
        importItems: canCrudRecord ? [
          {
            id: "IMPORT_DATA",
            text: "Import data",
            onClick: () =>
              navigate(
                `/core/load_sets/new?entity=Grit::Assays::ExperimentDataSheetRecord&experiment_id=${experiment_id}&assay_data_sheet_definition_id=${dataSheet.id}`,
              ),
          },
        ] : undefined,
        import: {
          requiredRoles: ["Administrator", "AssayAdministrator", "AssayUser"],
        },
      }),
    [canCrudRecord, dataSheet, experiment_id, navigate, registerToolbarAction],
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
        headerActions={
          canCrudRecord ? (
            <Button onClick={() => navigate("records/new")}>New</Button>
          ) : undefined
        }
        getRowId={getRowId}
        tableState={tableState}
        onRowClick={
          canCrudRecord ? ({ id }) => navigate(`records/${id}`) : undefined
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

const ExperimentDataSheet = ({
  dataSheets,
}: {
  dataSheets: ExperimentDataSheetData[];
}) => {
  const { sheet_id, experiment_id } = useParams() as {
    sheet_id: string;
    experiment_id: string;
  };
  const { data: experiment } = useExperiment(experiment_id);

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
        <Link to="../details">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );

  if (!dataSheet) {
    return <Navigate to=".." replace />;
  }

  return (
    <Routes>
      <Route
        index
        element={<ExperimentDataSheetRecords dataSheet={dataSheet} experiment={experiment!} />}
      />
      <Route
        path="records/:record_id"
        element={<ExperimentDataSheetRecordFormWrapper />}
      />
    </Routes>
  );
};

export default ExperimentDataSheet;
