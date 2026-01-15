import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { Filter, Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { EntityData, useHasRoles } from "@grit42/core";
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
import { useLocalStorage } from "@grit42/client-library/hooks";
import { useMemo } from "react";
import { ExperimentMetadataFilters } from "../../../../features/experiments";
import styles from "./assayModelExperiments.module.scss";

const getRowId = (data: EntityData) => data.id.toString();

const ExperimentsTable = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };
  const canCreateExperiment = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);

  const [metadataFilters, setMetadataFilters] = useLocalStorage(
    `assay-model_${assay_model_id}_experiment-metadata-filters`,
    {} as Record<string, number[]>,
  );

  const navigate = useNavigate();
  const { data: columns } = useExperimentColumns();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState(
    `assay-model_${assay_model_id}_experiments-list`,
    tableColumns,
  );

  const filters = useMemo(
    (): Filter[] => [
      ...tableState.filters,
      {
        active: true,
        column: "assay_model_id",
        id: "assay_model_id",
        operator: "in_list",
        property: "assay_model_id",
        property_type: "integer",
        type: "integer",
        value: assay_model_id,
      },
      ...Object.keys(metadataFilters).map(
        (key): Filter => ({
          active: true,
          column: key,
          id: key,
          operator: "in_list",
          property: key,
          property_type: "integer",
          type: "integer",
          value: metadataFilters[key],
        }),
      ),
    ],
    [tableState.filters, assay_model_id, metadataFilters],
  );

  const { data, isLoading, isError, error, fetchNextPage, isFetchingNextPage } =
    useInfiniteExperiments(tableState.sorting, filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
  );

  return (
    <div className={styles.container}>
      <Table
        className={styles.experimentsTable}
        getRowId={getRowId}
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
              <Button color="secondary">New</Button>
            </Link>
          ) : undefined
        }
        onRowClick={({ id }) => navigate(`/assays/experiments/${id}/details`)}
        tableState={tableState}
        data={flatData}
        loading={isLoading}
        noDataMessage={isError ? error : undefined}
        pagination={{
          fetchNextPage,
          isFetchingNextPage,
          totalRows: data?.pages[0].total,
        }}
      />
      <ExperimentMetadataFilters
        assayModelId={assay_model_id}
        metadataFilters={metadataFilters}
        setMetadataFilters={setMetadataFilters}
      />
    </div>
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
