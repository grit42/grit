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
import { useSetupTableState, DataGrid } from "@grit42/table";
import ExperimentDataSheetRecordFormWrapper from "./RecordForm";
import { useToolbar, useHasPermission } from "@grit42/core";
import NewIcon from "@grit42/client-library/icons/Circle1New";
import { ExperimentData } from "../../../../queries/experiments";
import styles from "./experimentData.module.scss"

const getRowId = (data: ExperimentDataSheetRecordData) => data.id.toString();

const ExperimentDataSheetRecords = ({
  dataSheet,
  experiment,
}: {
  dataSheet: ExperimentDataSheetData;
  experiment: ExperimentData;
}) => {
  const { experiment_id } = useParams() as { experiment_id: string };
  const canCrudRecord =
    useHasPermission("write:assays") &&
    experiment.publication_status_id__name !== "Published";
  const registerToolbarAction = useToolbar();
  const navigate = useNavigate();
  const { data: columns } = useExperimentDataSheetRecordColumns(dataSheet.id);

  const tableColumns = useTableColumns<ExperimentDataSheetRecordData>(columns);

  const tableState = useSetupTableState<ExperimentDataSheetRecordData>(
    `data-sheet-${dataSheet.id}-${experiment_id}`,
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
        importItems: canCrudRecord
          ? [
              {
                id: "IMPORT_DATA",
                text: "Import data",
                onClick: () =>
                  navigate(
                    `/core/load_sets/new?entity=Grit::Assays::ExperimentDataSheetRecord&experiment_id=${experiment_id}&assay_data_sheet_definition_id=${dataSheet.id}`,
                  ),
              },
            ]
          : undefined,
        import: {
          requiredPermissions: ["write:assays"],
        },
      }),
    [canCrudRecord, dataSheet, experiment_id, navigate, registerToolbarAction],
  );

  return (
    <DataGrid
      headerActions={
        canCrudRecord ? (
          <Button size="tiny" icon={<NewIcon height={16} />} onClick={() => navigate("records/new")} className={styles.newButton}>New record</Button>
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
  );
};

const ExperimentDataSheet = ({
  experiment,
}: {
  experiment: ExperimentData;
}) => {
  const { sheet_id } = useParams() as {
    sheet_id: string;
  };

  const dataSheet = useMemo(
    () =>
      sheet_id
        ? experiment.data_sheets.find(({ id }) => sheet_id === id.toString())
        : experiment.data_sheets[0],
    [experiment.data_sheets, sheet_id],
  );

  const { data, isLoading, isError, error } =
    useExperimentDataSheetRecordColumns(dataSheet?.id ?? "", undefined, {
      enabled: !!dataSheet,
    });

  if (!sheet_id) {
    return <Navigate to={experiment.data_sheets[0].id.toString()} />;
  }

  if (!dataSheet) {
    return <Navigate to=".." replace />;
  }

  if (isLoading) return <Spinner />;
  if (isError || !data) {
    return (
      <ErrorPage error={error}>
        <Link to="../details">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <Routes>
      <Route
        index
        element={
          <ExperimentDataSheetRecords
            dataSheet={dataSheet}
            experiment={experiment!}
          />
        }
      />
      <Route
        path="records/:record_id"
        element={<ExperimentDataSheetRecordFormWrapper />}
      />
    </Routes>
  );
};

export default ExperimentDataSheet;
