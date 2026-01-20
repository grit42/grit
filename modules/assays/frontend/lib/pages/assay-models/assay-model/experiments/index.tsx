import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { Filter, Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { EntityData } from "@grit42/core";
import {
  useExperimentColumns,
  useInfiniteExperiments,
} from "../../../../queries/experiments";
import { useNavigate, useParams } from "react-router-dom";
import { useLocalStorage } from "@grit42/client-library/hooks";
import { useMemo } from "react";
import styles from "./assayModelExperiments.module.scss";
import ExperimentFiltersSidebar, {
  ExperimentFilterValues,
} from "../../../../features/experiments/components/experiment-filters";

const getRowId = (data: EntityData) => data.id.toString();

const ExperimentsTable = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };

  const [metadataFilters, setMetadataFilters] = useLocalStorage(
    `assay-model_${assay_model_id}_experiment-sidebar-filters`,
    {} as ExperimentFilterValues,
  );

  const navigate = useNavigate();
  const { data: columns } = useExperimentColumns();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState(
    `assay-model_${assay_model_id}_experiments-list`,
    tableColumns,
    {
      settings: {
        disableVisibilitySettings: true,
        disableFilters: true,
      },
    },
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
      <ExperimentFiltersSidebar
        assayModelId={assay_model_id}
        filterValues={metadataFilters}
        setFilterValues={setMetadataFilters}
        showName
      />
      <Table
        getRowId={getRowId}
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
