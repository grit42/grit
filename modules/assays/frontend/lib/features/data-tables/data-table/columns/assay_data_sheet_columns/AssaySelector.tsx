import { ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  useAssayColumns,
  usePublishedAssaysOfModel,
} from "../../../../../queries/assays";
import { RowSelectionState, Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { SetStateAction, useCallback, useEffect, useMemo } from "react";
import { EntityData } from "@grit42/core";

const getRowId = (data: EntityData) => data.id.toString();

const AssaysTable = ({
  selectedAssays,
  setSelectedAssays,
  assayModelId,
}: Props) => {
  const { data: columns } = useAssayColumns(undefined, {
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
      selectedAssays?.reduce((acc, assay) => ({ ...acc, [assay]: true }), {}) ?? {},
    [selectedAssays],
  );

  const setSelection = useCallback(
    (selectionState: SetStateAction<RowSelectionState>) => {
      if (typeof selectionState === "function")
        selectionState = selectionState(selection);
      return setSelectedAssays(
        Object.entries(selectionState)
          .filter(([, value]) => value)
          .map(([key]) => Number(key)),
      );
    },
    [setSelectedAssays, selection],
  );

  const tableState = useSetupTableState("assays-list", tableColumns, {
    settings: {
      enableSelection: true,
      disableColumnReorder: true,
      disableFilters: true,
    },
    controlledState: {
      select: [selection, setSelection],
    },
  });

  useEffect(() => {}, [tableState.rowSelection]);

  const { data, isLoading, isError, error } = usePublishedAssaysOfModel(
    assayModelId,
    tableState.sorting,
  );

  return (
    <Table
      getRowId={getRowId}
      tableState={tableState}
      data={data}
      loading={isLoading}
      noDataMessage={isError ? error : "No published assays"}
      disableFooter
    />
  );
};

interface Props {
  assayModelId: string | number;
  selectedAssays: number[];
  setSelectedAssays: React.Dispatch<React.SetStateAction<number[]>>;
}

const AssaySelector = (props: Props) => {
  const {
    isLoading: isAssayColumnLoading,
    isError: isAssayColumnError,
    error: assayColumnError,
  } = useAssayColumns();

  if (isAssayColumnLoading) return <Spinner />;
  if (isAssayColumnError) return <ErrorPage error={assayColumnError} />;
  return <AssaysTable {...props} />;
};

export default AssaySelector;
