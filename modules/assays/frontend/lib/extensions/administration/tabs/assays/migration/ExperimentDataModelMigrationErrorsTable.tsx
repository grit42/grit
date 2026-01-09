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

import { Filter, SortingState, Table, useSetupTableState } from "@grit42/table";
import { useNavigate } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useTableColumns } from "@grit42/core/utils";
import styles from "./migration.module.scss";
import {
  EntityPropertyDef,
  useEntityColumns,
  useInfiniteEntityData,
} from "@grit42/core";
import {
  EndpointError,
  EndpointErrorErrors,
  EndpointSuccess,
  PaginatedEndpointSuccess,
  request,
  UndefinedInitialDataInfiniteOptions,
  URLParams,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from "@grit42/api";
import { toast } from "@grit42/notifications";

const DEFAULT_COLUMN_SIZES = {
  name: 200,
  description: 750,
} as const;

export const useExperimentDataModelMigrationErrorColumns = (
  params: Record<string, any> = {},
  queryOptions: Partial<UseQueryOptions<EntityPropertyDef[], string>> = {},
) => {
  return useEntityColumns<EntityPropertyDef>(
    "Grit::Assays::ExperimentDataModelMigrationError",
    params,
    queryOptions,
  );
};

export const useExperimentDataModelMigrationErrors = (
  sort?: SortingState,
  filter?: Filter[],
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<PaginatedEndpointSuccess<any[]>, string>
  > = {},
) => {
  return useInfiniteEntityData<any>(
    "grit/assays/experiment_data_model_migration_errors",
    sort,
    filter,
    params,
    queryOptions,
  );
};

export const useExperimentDataModelMigrationChecks = (
  params: URLParams = {},
  queryOptions: Partial<
    UndefinedInitialDataInfiniteOptions<PaginatedEndpointSuccess<any[]>, string>
  > = {},
) => {
  return useInfiniteEntityData<any>(
    "grit/assays/experiment_data_model_migration_checks",
    [{ id: "created_at", desc: true }],
    undefined,
    params,
    queryOptions,
  );
};

const ExperimentDataModelMigrationErrorsTable = () => {
  const navigate = useNavigate();
  const {
    data: assayTypes,
    fetchNextPage,
    isFetchingNextPage,
  } = useExperimentDataModelMigrationErrors();
  const { data: assayTypeColumns } =
    useExperimentDataModelMigrationErrorColumns(undefined, {
      select: (data) =>
        data.map((d) => ({
          ...d,
          defaultColumnSize:
            DEFAULT_COLUMN_SIZES[d.name as keyof typeof DEFAULT_COLUMN_SIZES],
        })),
    });

  const tableColumns = useTableColumns(assayTypeColumns);

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["experiment_data_integrity_recheck"],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors>
      >(`grit/assays/check_migration`, {
        method: "POST",
      });
      if (!response.success) {
        toast.error(response.errors as string);
      }
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          "grit/assays/experiment_data_model_migration_errors",
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          "grit/assays/experiment_data_model_migration_checks",
        ],
      });
    },
  });

  const tableState = useSetupTableState(
    "admin-migration_errors-list",
    tableColumns,
    {
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
    },
  );

  return (
    <Table
      header="Migration errors"
      tableState={tableState}
      headerActions={
        <Button
          onClick={() => mutation.mutateAsync()}
          loading={mutation.isPending}
        >
          Check again
        </Button>
      }
      className={styles.typesTable}
      data={assayTypes?.pages.flatMap(({ data }) => data)}
      onRowClick={(row) =>
        navigate(
          `${row.original.id}/${row.original.experiment_data_sheet_id}/${row.original.experiment_data_sheet_record_id}`,
        )
      }
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: assayTypes?.pages[0].total,
      }}
    />
  );
};

const ExperimentDataModelMigrationTrigger = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationKey: ["experiment_data_integrity_check"],
    mutationFn: async () => {
      const response = await request<
        EndpointSuccess,
        EndpointError<EndpointErrorErrors>
      >(`grit/assays/check_migration`, {
        method: "POST",
      });
      if (!response.success) {
        toast.error(response.errors as string);
      }
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          "grit/assays/experiment_data_model_migration_errors",
        ],
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "infiniteData",
          "grit/assays/experiment_data_model_migration_checks",
        ],
      });
    },
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--spacing)"}}>
      <h3>Check for experiment records integrity</h3>
      <p>It is recommended to make no modification in the meantime.</p>
      <Button
        color="secondary"
        onClick={() => mutation.mutateAsync()}
        loading={mutation.isPending}
      >
        Check
      </Button>
    </div>
  );
};

const ExperimentDataModelMigrationErrorsTableWrapper = () => {
  const {
    isLoading: isAssayTypeColumnsLoading,
    isError: isAssayTypeColumnsError,
    error: assayTypeColumnsError,
  } = useExperimentDataModelMigrationErrorColumns();

  const { isLoading, isError, error } = useExperimentDataModelMigrationErrors();
  const {
    data,
    isLoading: isChecksLoading,
    isError: isChecksError,
    error: checksError,
  } = useExperimentDataModelMigrationChecks();

  if (isChecksLoading || isAssayTypeColumnsLoading || isLoading)
    return <Spinner />;

  if (!data || isChecksError || isAssayTypeColumnsError || isError)
    return <ErrorPage error={checksError ?? assayTypeColumnsError ?? error} />;

  const flatData = data.pages.flatMap(({ data }) => data);

  if (flatData.length === 0) {
    return <ExperimentDataModelMigrationTrigger />;
  }

  if (flatData[0].error_count === 0) {
    return <h1>No errors!</h1>;
  }

  return <ExperimentDataModelMigrationErrorsTable />;
};

export default ExperimentDataModelMigrationErrorsTableWrapper;
