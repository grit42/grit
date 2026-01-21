import { Button } from "@grit42/client-library/components";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { useHasRoles } from "@grit42/core";
import {
  useExperimentColumns,
  useExperiments,
} from "../../queries/experiments";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useToolbar } from "@grit42/core/Toolbar";
import Circle1NewIcon from "@grit42/client-library/icons/Circle1New";

const ExperimentsTable = () => {
  const canCreateExperiment = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);
  const registerToolbarActions = useToolbar();
  const navigate = useNavigate();
  const { data: columns } = useExperimentColumns();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("experiments-list", tableColumns);

  const { data, isLoading, isError, error } = useExperiments(
    tableState.sorting,
    tableState.filters,
  );

  useEffect(() => {
    return registerToolbarActions({
      actions: [
        {
          id: "NEW",
          icon: <Circle1NewIcon />,
          label: "New Experiment",
          onClick: () => navigate("new"),
          disabled: !canCreateExperiment,
        },
      ],
    });
  }, [registerToolbarActions, canCreateExperiment, navigate]);

  return (
    <Table
      header="Experiments"
      headerActions={
        canCreateExperiment ? (
          <Link to="new">
            <Button>New</Button>
          </Link>
        ) : undefined
      }
      onRowClick={({ original }) => navigate(`${original.id}/details`)}
      tableState={tableState}
      data={data}
      loading={isLoading}
      noDataMessage={isError ? error : "No experiments"}
    />
  );
};

export default ExperimentsTable;
