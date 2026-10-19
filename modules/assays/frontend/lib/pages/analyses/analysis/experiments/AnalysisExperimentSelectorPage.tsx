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

import { useCallback } from "react";
import { useTableColumns } from "@grit42/core/utils";
import { Row, Table, useSetupTableState } from "@grit42/table";
import {
  AnalysisExperiment,
  useAnalysisContext,
} from "../../../../features/analyses";
import {
  useInfiniteAvailableAnalysisExperiments,
  useInfiniteSelectedAnalysisExperiments,
} from "../../../../features/analyses/queries";
import { Link } from "react-router-dom";
import {
  Button,
  ErrorPage,
  LoadingPage,
} from "@grit42/client-library/components";
import {
  EntityPropertyDef,
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useHasPermission,
} from "@grit42/core";
import { useQueryClient } from "@grit42/api";
import {
  ExperimentData,
  useExperimentColumns,
} from "../../../../queries/experiments";
import styles from "./experiments.module.scss";

const getRowId = (data: ExperimentData) => data.id.toString();

const AnalysisExperimentSelector = ({
  columns,
  analysisId,
}: {
  analysisId: string | number;
  columns: EntityPropertyDef[];
}) => {
  const queryClient = useQueryClient();
  const tableColumns = useTableColumns<ExperimentData>(columns);
  const availableTableState = useSetupTableState(
    "analysis-available-experiments",
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

  const selectedTableState = useSetupTableState<ExperimentData>(
    "analysis-selected-experiments",
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
    selectedTableState.sorting,
    selectedTableState.filters,
  );

  const availableExperiments = useInfiniteAvailableAnalysisExperiments(
    analysisId,
    availableTableState.sorting,
    availableTableState.filters,
  );

  const createEntityMutation = useCreateEntityMutation<AnalysisExperiment>(
    `grit/assays/analyses/${analysisId}/analysis_experiments`,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    `grit/assays/analyses/${analysisId}/analysis_experiments`,
  );

  const onAvailableRowClick = useCallback(
    async (row: Row<ExperimentData>) => {
      await createEntityMutation.mutateAsync({
        experiment_id: row.original.id,
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          `grit/assays/${analysisId}/analysis_experiments`,
        ],
      });
    },
    [analysisId, createEntityMutation, queryClient],
  );

  const onSelectedRowClick = useCallback(
    async (row: Row<ExperimentData>) => {
      await destroyEntityMutation.mutateAsync(
        row.original.experiment_analysis_id,
      );
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          `grit/assays/${analysisId}/analysis_experiments`,
        ],
      });
    },
    [analysisId, destroyEntityMutation, queryClient],
  );

  return (
    <div className={styles.metadataSelector}>
      <Table
        header="Selected"
        getRowId={getRowId}
        onRowClick={onSelectedRowClick}
        loading={selectedExperiments.isLoading}
        tableState={selectedTableState}
        disableFooter
        data={selectedExperiments.data?.pages.flatMap(({ data }) => data)}
        noDataMessage={
          (selectedExperiments.isError
            ? selectedExperiments.error
            : undefined) ??
          "No experiment selected. Analysis will include all experiments"
        }
        pagination={{
          fetchNextPage: selectedExperiments.fetchNextPage,
          isFetchingNextPage: selectedExperiments.isFetchingNextPage,
          totalRows: selectedExperiments.data?.pages[0]?.total,
        }}
      />
      <Table
        header="Available"
        getRowId={getRowId}
        onRowClick={onAvailableRowClick}
        headerActions={
          <Link to="..">
            <Button color="secondary">Done</Button>
          </Link>
        }
        loading={availableExperiments.isLoading}
        tableState={availableTableState}
        disableFooter
        data={availableExperiments.data?.pages.flatMap(({ data }) => data)}
        noDataMessage={
          (availableExperiments.isError
            ? availableExperiments.error
            : undefined) ?? "No experiments available"
        }
        pagination={{
          fetchNextPage: availableExperiments.fetchNextPage,
          isFetchingNextPage: availableExperiments.isFetchingNextPage,
          totalRows: availableExperiments.data?.pages[0]?.total,
        }}
      />
    </div>
  );
};

const AnalysisExperimentSelectorPage = () => {
  const { analysis } = useAnalysisContext();
  const canEdit = useHasPermission("write:analysis");

  const columns = useExperimentColumns(undefined, {
    enabled: canEdit,
  });

  if (!canEdit) {
    return (
      <ErrorPage error="You do not have the authorization to edit analyses." />
    );
  }

  if (columns.isLoading) {
    return <LoadingPage />;
  }

  if (columns.isError || !columns.data) {
    return <ErrorPage error={columns.error} />;
  }

  return (
    <AnalysisExperimentSelector
      columns={columns.data}
      analysisId={analysis.id}
    />
  );
};

export default AnalysisExperimentSelectorPage;
