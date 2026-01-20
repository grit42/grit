import {
  Button,
  ButtonGroup,
  ErrorPage,
  Spinner,
} from "@grit42/client-library/components";
import {
  Filter,
  Filters,
  GritColumnDef,
  GritColumnVisibility,
  Table,
  useSetupTableState,
} from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { EntityData, useHasRoles } from "@grit42/core";
import {
  useExperimentColumns,
  useExperiments,
} from "../../queries/experiments";
import { Link, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@grit42/client-library/hooks";
import { useMemo } from "react";
import styles from "./experiments.module.scss";
import ExperimentFiltersSidebar, {
  ExperimentFilterValues,
} from "../../features/experiments/components/experiment-filters";

const getRowId = (data: EntityData) => data.id.toString();

const ExperimentsTable = () => {
  const canCreateExperiment = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);
  const [sidebarFilters, setSidebarFilters] = useLocalStorage(
    "experiment-sidebar-filters",
    {
      assay_type_id: [],
      assay_model_id: [],
      name: "",
    } as ExperimentFilterValues,
  );

  const navigate = useNavigate();
  const { data: columns } = useExperimentColumns();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("experiments-list", tableColumns, {
    settings: {
      disableFilters: true,
      disableVisibilitySettings: true,
    },
  });

  const filters = useMemo((): Filter[] => {
    const { assay_type_id, assay_model_id, name, ...metadata } = sidebarFilters;
    return [
      ...tableState.filters,
      {
        active: !!assay_type_id?.length,
        column: "assay_type_id",
        id: "assay_type_id",
        operator: "in_list",
        property: "assay_type_id",
        property_type: "integer",
        type: "integer",
        value: assay_type_id,
      },
      {
        active: !!assay_model_id?.length,
        column: "assay_model_id",
        id: "assay_model_id",
        operator: "in_list",
        property: "assay_model_id",
        property_type: "integer",
        type: "integer",
        value: assay_model_id,
      },
      {
        active: !!name?.length,
        column: "name",
        id: "name",
        operator: "contains",
        property: "name",
        property_type: "string",
        type: "name",
        value: name,
      },
      ...Object.keys(metadata).map(
        (key): Filter => ({
          active: true,
          column: key,
          id: key,
          operator: "in_list",
          property: key,
          property_type: "integer",
          type: "integer",
          value: metadata[key],
        }),
      ),
    ];
  }, [tableState.filters, sidebarFilters]);

  const { data, isLoading, isError, error } = useExperiments(
    tableState.sorting,
    filters,
  );

  const filterableColumns = useMemo(
    () =>
      tableColumns
        .filter(({ id }) => tableState.columnVisibility[id] ?? true)
        .sort((a, b) => {
          const indexA = tableState.columnOrder.indexOf(a.id as string);
          const indexB = tableState.columnOrder.indexOf(b.id as string);

          if (indexA < indexB) return -1;
          if (indexA > indexB) return 1;

          return 0;
        }) as GritColumnDef[],
    [tableColumns, tableState.columnOrder, tableState.columnVisibility],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "min-content 1fr",
        gridTemplateRows: "min-content 1fr",
        overflow: "auto",
        height: "100%",
        gap: "var(--spacing)",
      }}
    >
      <h2>Experiments</h2>
      <ButtonGroup style={{ marginInlineStart: "auto" }}>
        {canCreateExperiment && (
          <Link to="new">
            <Button color="secondary">New</Button>
          </Link>
        )}

        <Filters
          columns={filterableColumns}
          filters={tableState.filters}
          setFilters={tableState.setFilters}
        />
        <GritColumnVisibility
          columnOrder={tableState.columnOrder}
          columns={tableColumns as GritColumnDef[]}
          columnVisibility={tableState.columnVisibility}
          setColumnVisibility={tableState.setColumnVisibility}
        />
      </ButtonGroup>
      <ExperimentFiltersSidebar
        showAssayType
        showAssayModel
        showName
        filterValues={sidebarFilters}
        setFilterValues={setSidebarFilters}
      />
      <Table
        className={styles.experimentsTable}
        getRowId={getRowId}
        onRowClick={({ id }) => navigate(`${id}/details`)}
        tableState={tableState}
        data={data}
        loading={isLoading}
        noDataMessage={
          isError
            ? error
            : filters.some(({ active }) => active)
            ? "All experiments are filtered"
            : "No experiments"
        }
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
