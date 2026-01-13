import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { Filter, Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { EntityData, useHasRoles } from "@grit42/core";
import {
  useExperimentColumns,
  useExperiments,
} from "../../queries/experiments";
import { Link, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@grit42/client-library/hooks";
import { useMemo } from "react";
import { ExperimentMetadataFilters } from "../../features/experiments";

const getRowId = (data: EntityData) => data.id.toString();

const ExperimentsTable = () => {
  const canCreateExperiment = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);
  const [metadataFilters, setMetadataFilters] = useLocalStorage(
    "experiment-metadata-filters",
    {} as Record<string, number[]>,
  );

  const navigate = useNavigate();
  const { data: columns } = useExperimentColumns();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("experiments-list", tableColumns);

  const filters = useMemo(
    () => [
      ...tableState.filters,
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
    [tableState.filters, metadataFilters],
  );

  const { data, isLoading, isError, error } = useExperiments(
    tableState.sorting,
    filters,
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "min-content 1fr",
        gridTemplateRows: "1fr",
        overflow: "auto",
        height: "100%",
        gap: "var(--spacing)",
      }}
    >
      <ExperimentMetadataFilters
        metadataFilters={metadataFilters}
        setMetadataFilters={setMetadataFilters}
      />
      <Table
        header="Experiments"
        getRowId={getRowId}
        headerActions={
          canCreateExperiment ? (
            <Link to="new">
              <Button color="secondary">New</Button>
            </Link>
          ) : undefined
        }
        onRowClick={({ id }) => navigate(`${id}/details`)}
        tableState={tableState}
        data={data}
        loading={isLoading}
        noDataMessage={isError ? error : undefined}
      />
    </div>
  );
};

const Experiments = () => {
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

export default Experiments;
