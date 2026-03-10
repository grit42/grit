import { Button } from "@grit42/client-library/components";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { useHasRoles, useToolbar } from "@grit42/core";
import {
  useExperimentColumns,
  useInfiniteExperiments,
} from "../../queries/experiments";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";
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

  const { data, isLoading, isFetchingNextPage, isError, error, fetchNextPage } =
    useInfiniteExperiments(tableState.sorting, tableState.filters);

  const flatData = useMemo(
    () => data?.pages.flatMap(({ data }) => data) ?? [],
    [data],
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
      data={flatData}
      loading={isLoading}
      noDataMessage={isError ? error : "No experiments"}
      pagination={{
        fetchNextPage,
        isFetchingNextPage,
        totalRows: data?.pages[0]?.total,
      }}
    />
  );
};

export default ExperimentsTable;
