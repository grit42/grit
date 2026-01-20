import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import {
  useExperimentColumns,
  useInfiniteExperiments,
} from "../../../../queries/experiments";
import {
  createSearchParams,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useMemo } from "react";
import { useHasRoles } from "@grit42/core";

const ExperimentsTable = () => {
  const canCreateExperiment = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);
  const navigate = useNavigate();
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const { data: columns } = useExperimentColumns();
  const tableColumns = useTableColumns(columns);
  const tableState = useSetupTableState(
    `assay-model_${assay_model_id}_experiments-list`,
    tableColumns,
  );

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteExperiments(tableState.sorting, tableState.filters, {
      assay_model_id,
    });
  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <Table
      onRowClick={({ original }) =>
        navigate(`/assays/experiments/${original.id.toString()}/details`)
      }
      headerActions={
        canCreateExperiment ? (
          <Link
            to={{
              pathname: "/assays/experiments/new",
              search: createSearchParams({
                assay_model_id: assay_model_id,
              }).toString(),
            }}
          >
            <Button>New</Button>
          </Link>
        ) : undefined
      }
      tableState={tableState}
      data={flatData}
      loading={isLoading}
      noDataMessage={isError ? error : "This Assay model has no Experiments"}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0].total,
      }}
    />
  );
};

const AssayModelExperiments = () => {
  const {
    isLoading: isExperimentColumnLoading,
    isError: isExperimentColumnError,
    error: assayTypeColumnError,
  } = useExperimentColumns();

  if (isExperimentColumnLoading) return <Spinner />;
  if (isExperimentColumnError)
    return <ErrorPage error={assayTypeColumnError} />;
  return <ExperimentsTable />;
};

export default AssayModelExperiments;
