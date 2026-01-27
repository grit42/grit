import { ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  Filter,
  RowSelectionState,
  Table,
  useSetupTableState,
} from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { SetStateAction, useCallback, useEffect, useMemo } from "react";
import { EntityData } from "@grit42/core";
import {
  useExperimentColumns,
  usePublishedExperimentsOfModel,
} from "../../../../../queries/experiments";
import { useAssayMetadataDefinitions } from "../../../../../queries/assay_metadata_definitions";

const getRowId = (data: EntityData) => data.id.toString();

const ExperimentsTable = ({
  selectedExperiments = [],
  setSelectedExperiments,
  assayModelId,
  metadataFilters,
}: Props) => {
  const { data: columns } = useExperimentColumns(undefined, {
    select: (data) =>
      data.map((c) =>
        [
          "publication_status_id__name",
          "assay_model_id__name",
          "assay_type_id__name",
          "description",
        ].includes(c.name.toString())
          ? { ...c, default_hidden: true }
          : c,
      ),
  });

  const tableColumns = useTableColumns(columns);

  const selection = useMemo(
    () =>
      selectedExperiments?.reduce(
        (acc, experiment) => ({ ...acc, [experiment]: true }),
        {},
      ) ?? {},
    [selectedExperiments],
  );

  const setSelection = useCallback(
    (selectionState: SetStateAction<RowSelectionState>) => {
      if (typeof selectionState === "function")
        selectionState = selectionState(selection);
      return setSelectedExperiments(
        Object.entries(selectionState)
          .filter(([, value]) => value)
          .map(([key]) => Number(key)),
      );
    },
    [setSelectedExperiments, selection],
  );

  const tableState = useSetupTableState(
    "data-table-assays-list",
    tableColumns,
    {
      settings: {
        enableSelection: true,
        disableColumnReorder: true,
        disableFilters: true,
        disableVisibilitySettings: true,
      },
      controlledState: {
        select: [selection, setSelection],
      },
    },
  );

  const {
    data: metadataDefinitions,
    isLoading: isMetadataDefinitionsLoading,
    isError: isMetadataDefinitionsError,
    error: metadataDefinitionsError,
  } = useAssayMetadataDefinitions();

  const filters = useMemo(
    () =>
      Object.keys(metadataFilters).map(
        (key): Filter => ({
          active: true,
          column:
            metadataDefinitions?.find(({ id }) => key === id.toString())
              ?.safe_name ?? "",
          id: key,
          operator: "in_list",
          property:
            metadataDefinitions?.find(({ id }) => key === id.toString())
              ?.safe_name ?? "",
          property_type: "integer",
          type: "integer",
          value: metadataFilters[key],
        }),
      ),
    [metadataDefinitions, metadataFilters],
  );

  const { data, isLoading, isError, error } = usePublishedExperimentsOfModel(
    assayModelId,
    tableState.sorting,
    filters,
    undefined,
    {
      enabled: !!metadataDefinitions,
    },
  );

  useEffect(() => {
    if (!data) return;
    if (
      data &&
      selectedExperiments.every((selectedId) =>
        data.find(({ id }) => selectedId == id),
      )
    )
      return;
    setSelectedExperiments((prev) =>
      prev?.filter((selectedId) => data?.find(({ id }) => selectedId == id)),
    );
  }, [data, selectedExperiments, setSelectedExperiments]);

  if (isMetadataDefinitionsError) {
    return <ErrorPage error={metadataDefinitionsError} />;
  }

  return (
    <Table
      getRowId={getRowId}
      tableState={tableState}
      onRowClick={({ id }) =>
        setSelectedExperiments(
          selectedExperiments?.includes(Number(id))
            ? selectedExperiments.filter(
                (selectedId) => Number(id) !== selectedId,
              )
            : [...selectedExperiments, Number(id)],
        )
      }
      data={data}
      loading={isLoading || isMetadataDefinitionsLoading}
      noDataMessage={
        isError
          ? error
          : "No published experiments matching selected metadata in this assay model"
      }
      disableFooter
    />
  );
};

interface Props {
  assayModelId: string | number;
  metadataFilters: Record<string, number[]>;
  selectedExperiments: number[];
  setSelectedExperiments: React.Dispatch<
    React.SetStateAction<number[] | undefined>
  >;
}

const ExperimentSelector = (props: Props) => {
  const {
    isLoading: isExperimentColumnLoading,
    isError: isExperimentColumnError,
    error: assayColumnError,
  } = useExperimentColumns();

  if (isExperimentColumnLoading) return <Spinner />;
  if (isExperimentColumnError) return <ErrorPage error={assayColumnError} />;
  return <ExperimentsTable {...props} />;
};

export default ExperimentSelector;
