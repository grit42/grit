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

import { useTableColumns } from "@grit42/core/utils";
import { Table, useSetupTableState } from "@grit42/table";
import { useAnalysisContext } from "../../../../features/analyses";
import { useInfiniteSelectedAnalysisExperiments } from "../../../../features/analyses/queries";
import { CenteredColumnLayout } from "@grit42/client-library/layouts";
import { Link } from "react-router-dom";
import {
  Button,
  ErrorPage,
  LoadingPage,
} from "@grit42/client-library/components";
import { EntityPropertyDef, useHasPermission } from "@grit42/core";
import {
  ExperimentData,
  useExperimentColumns,
} from "../../../../queries/experiments";

const getRowId = (data: ExperimentData) => data.id.toString();

const AnalysisExperiments = ({
  columns,
  analysisId,
}: {
  analysisId: string | number;
  columns: EntityPropertyDef[];
}) => {
  const canEdit = useHasPermission("write:analysis");
  const tableColumns = useTableColumns<ExperimentData>(columns);
  const tableState = useSetupTableState<ExperimentData>(
    "analysis-experiments",
    tableColumns,
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

  const selectedExperiments = useInfiniteSelectedAnalysisExperiments(
    analysisId,
    tableState.sorting,
    tableState.filters,
  );

  return (
    <CenteredColumnLayout>
      <Table
        headerActions={
          canEdit ? (
            <Link to="edit">
              <Button>Edit</Button>
            </Link>
          ) : undefined
        }
        fitContent
        getRowId={getRowId}
        loading={selectedExperiments.isLoading}
        tableState={tableState}
        disableFooter
        data={selectedExperiments.data?.pages.flatMap(({ data }) => data)}
        noDataMessage={
          (selectedExperiments.isError
            ? selectedExperiments.error
            : undefined) ??
          "No experiment selected.\nAnalysis will include all experiments."
        }
        pagination={{
          fetchNextPage: selectedExperiments.fetchNextPage,
          isFetchingNextPage: selectedExperiments.isFetchingNextPage,
          totalRows: selectedExperiments.data?.pages[0]?.total,
        }}
      />
    </CenteredColumnLayout>
  );
};

const AnalysisExperimentsPage = () => {
  const { analysis } = useAnalysisContext();

  const columns = useExperimentColumns();

  if (columns.isLoading) {
    return <LoadingPage />;
  }

  if (columns.isError || !columns.data) {
    return <ErrorPage error={columns.error} />;
  }

  return (
    <AnalysisExperiments columns={columns.data} analysisId={analysis.id} />
  );
};

export default AnalysisExperimentsPage;
