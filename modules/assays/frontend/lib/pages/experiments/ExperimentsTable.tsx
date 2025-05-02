import { Button, ErrorPage, Spinner } from "@grit/client-library/components";
import { Table, useSetupTableState } from "@grit/table";
import { useTableColumns } from "@grit/core/utils";
import { EntityData, useHasRoles } from "@grit/core";
import {
  useExperimentColumns,
  useExperiments,
} from "../../queries/experiments";
import { Link, useNavigate } from "react-router-dom";

const getRowId = (data: EntityData) => data.id.toString();

const ExperimentsTable = () => {
  const canCreateExperiment = useHasRoles(["Administrator", "AssayAdministrator", "AssayUser"])

  const navigate = useNavigate();
  const { data: columns } = useExperimentColumns();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("experiments-list", tableColumns);
  const { data, isLoading, isError, error } = useExperiments(tableState.sorting, tableState.filters);

  return (
    <Table
      header="Experiments"
      getRowId={getRowId}
      headerActions={
        canCreateExperiment ? <Link to="new">
          <Button color="secondary">New</Button>
        </Link> : undefined
      }
      onRowClick={({ id }) => navigate(`${id}/details`)}
      tableState={tableState}
      data={data}
      loading={isLoading}
      noDataMessage={isError ? error : undefined}
    />
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
