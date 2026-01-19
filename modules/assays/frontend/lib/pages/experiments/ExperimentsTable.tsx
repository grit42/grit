import {
  Button,
  ErrorPage,
  Input,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { Filter, Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import {
  EntityData,
  EntityFormFieldEntity,
  EntitySelector,
  useHasRoles,
} from "@grit42/core";
import {
  useExperimentColumns,
  useExperiments,
} from "../../queries/experiments";
import { Link, useNavigate } from "react-router-dom";
import { useLocalStorage } from "@grit42/client-library/hooks";
import { useEffect, useMemo, useState } from "react";
import { ExperimentMetadataFilters } from "../../features/experiments";
import styles from "./experiments.module.scss";
import { useAssayModels } from "../../queries/assay_models";
import { useDebounceCallback } from "usehooks-ts";

const getRowId = (data: EntityData) => data.id.toString();

const ASSAY_TYPE_ENTITY: EntityFormFieldEntity = {
  name: "Assay type",
  full_name: "Grit::Assays::AssayType",
  path: `grit/assays/assay_types`,
  primary_key: "id",
  primary_key_type: "integer",
  column: "assay_type_id__name",
  display_column: "name",
  display_column_type: "string",
  multiple: true,
};
const ASSAY_MODEL_ENTITY: EntityFormFieldEntity = {
  name: "Assay model",
  full_name: "Grit::Assays::AssayModel",
  path: `grit/assays/assay_models`,
  primary_key: "id",
  primary_key_type: "integer",
  column: "assay_model_id__name",
  display_column: "name",
  display_column_type: "string",
  multiple: true,
};

interface ExperimentPropertiesFiltersValue {
  assay_type_id?: number[];
  assay_model_id?: number[];
  name?: string;
}

const ExperimentPropFilters = ({
  filters,
  setFilters,
}: {
  filters: ExperimentPropertiesFiltersValue;
  setFilters: (
    v:
      | ExperimentPropertiesFiltersValue
      | ((
          prev: ExperimentPropertiesFiltersValue | undefined,
        ) => ExperimentPropertiesFiltersValue),
  ) => void;
}) => {
  const [experimentName, setExperimentName] = useState(filters.name ?? "");
  const { data: assayModels } = useAssayModels();

  const setAssayTypeFilter = (v: number | number[] | null) =>
    setFilters((prev = {}) => {
      const newState = { ...prev };
      if (Array.isArray(v) && v.length > 0) {
        newState.assay_type_id = v;
      } else if (!Array.isArray(v) && v) {
        newState.assay_type_id = [v];
      } else {
        delete newState.assay_type_id;
      }
      if (assayModels && newState.assay_type_id) {
        const typesModels = assayModels.filter(({ assay_type_id }) =>
          newState.assay_type_id?.includes(assay_type_id),
        );
        newState.assay_model_id = newState.assay_model_id?.filter(
          (assay_model_id) =>
            typesModels.some(({ id }) => assay_model_id === id),
        );
        if (newState.assay_model_id?.length === 0) {
          delete newState.assay_model_id;
        }
      } else if (!assayModels) {
        delete newState.assay_model_id;
      }
      return newState;
    });

  const setAssayModelFilter = (v: number | number[] | null) =>
    setFilters((prev = {}) => {
      if (Array.isArray(v) && v.length > 0) {
        return { ...prev, assay_model_id: v };
      } else if (!Array.isArray(v) && v) {
        return { ...prev, assay_model_id: [v] };
      } else {
        const newState = { ...prev };
        delete newState.assay_model_id;
        return newState;
      }
    });

  const setNameFilter = useDebounceCallback(
    (v: string) =>
      setFilters((prev = {}) => {
        if (v?.length > 0) {
          return { ...prev, name: v };
        } else {
          const newState = { ...prev };
          delete newState.name;
          return newState;
        }
      }),
    250,
  );

  useEffect(() => {
    if (experimentName !== filters.name) {
      setNameFilter(experimentName);
      return setNameFilter.cancel;
    }
  }, [experimentName, filters.name, setNameFilter]);

  return (
    <Surface
      style={{
        display: "grid",
        gridTemplateColumns: "20vw",
        gap: "calc(var(--spacing) * 2)",
        gridAutoRows: "max-content",
        overflow: "auto",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Properties filters</h2>
        {Object.keys(filters).length > 0 && (
          <Button
            color="primary"
            onClick={() => {
              setExperimentName("");
              setFilters({});
            }}
          >
            Clear
          </Button>
        )}
      </div>
      <EntitySelector
        entity={ASSAY_TYPE_ENTITY}
        onChange={setAssayTypeFilter}
        onBlur={() => void 0}
        label="Assay type"
        value={filters.assay_type_id}
        error=""
        multiple
      />
      <EntitySelector
        entity={{
          ...ASSAY_MODEL_ENTITY,
          filters: [
            {
              active: true,
              column: "assay_type_id",
              id: "assay_type_id",
              operator: "in_list",
              property: "assay_type_id",
              property_type: "integer",
              type: "integer",
              value: filters.assay_type_id,
            },
          ],
        }}
        onChange={setAssayModelFilter}
        onBlur={() => void 0}
        label="Assay model"
        value={filters.assay_model_id}
        error=""
        multiple
      />
      <Input
        label="Experiment name"
        placeholder="Experiment name"
        type="string"
        onChange={(e) => setExperimentName(e.target.value)}
        value={experimentName}
      />
    </Surface>
  );
};

const ExperimentsTable = () => {
  const canCreateExperiment = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);
  const [propFilters, setPropFilters] = useLocalStorage(
    "experiment-prop-filters",
    {} as ExperimentPropertiesFiltersValue,
  );
  const [metadataFilters, setMetadataFilters] = useLocalStorage(
    "experiment-metadata-filters",
    {} as Record<string, number[]>,
  );

  const navigate = useNavigate();
  const { data: columns } = useExperimentColumns();

  const tableColumns = useTableColumns(columns);

  const tableState = useSetupTableState("experiments-list", tableColumns);

  const filters = useMemo(
    (): Filter[] => [
      ...tableState.filters,
      {
        active: !!propFilters.assay_type_id?.length,
        column: "assay_type_id",
        id: "assay_type_id",
        operator: "in_list",
        property: "assay_type_id",
        property_type: "integer",
        type: "integer",
        value: propFilters.assay_type_id,
      },
      {
        active: !!propFilters.assay_model_id?.length,
        column: "assay_model_id",
        id: "assay_model_id",
        operator: "in_list",
        property: "assay_model_id",
        property_type: "integer",
        type: "integer",
        value: propFilters.assay_model_id,
      },
      {
        active: !!propFilters.name?.length,
        column: "name",
        id: "name",
        operator: "contains",
        property: "name",
        property_type: "string",
        type: "name",
        value: propFilters.name,
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
    [tableState.filters, propFilters, metadataFilters],
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
        gridTemplateRows: "min-content 1fr",
        overflow: "auto",
        height: "100%",
        gap: "var(--spacing)",
      }}
    >
      <ExperimentPropFilters
        filters={propFilters}
        setFilters={setPropFilters}
      />
      <ExperimentMetadataFilters
        metadataFilters={metadataFilters}
        setMetadataFilters={setMetadataFilters}
      />
      <Table
        className={styles.experimentsTable}
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
