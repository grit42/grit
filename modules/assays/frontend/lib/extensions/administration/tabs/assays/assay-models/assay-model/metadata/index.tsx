import { Button, ErrorPage, Spinner } from "@grit/client-library/components";
import {
  EntityPropertyDef,
  EntityData,
  useCreateEntityMutation,
  useDestroyEntityMutation,
} from "@grit/core";
import { useCallback, useMemo } from "react";
import {
  AssayMetadataDefinitionData,
  useAssayMetadataDefinitionColumns,
  useAssayMetadataDefinitions,
  useAssayMetadataDefinitionsByAssayModel,
} from "../../../../../../../queries/assay_metadata_definitions";
import { Row, Table, useSetupTableState } from "@grit/table";
import { useTableColumns } from "@grit/core/utils";
import { Link, Route, Routes, useParams } from "react-router-dom";
import { queryClient } from "@grit/api";

const getRowId = (data: EntityData) => data.id.toString();

const AssayMetadataDefinitionSelector = ({
  columns,
  assayModelId,
}: {
  assayModelId: string | number;
  columns: EntityPropertyDef<AssayMetadataDefinitionData>[];
}) => {
  const tableColumns = useTableColumns(columns);
  const availableTableState = useSetupTableState("assay-model-available-metadata", tableColumns, {
    saveState: {
      columnSizing: true
    },
    settings: {
      disableColumnReorder: true,
      disableVisibilitySettings: true,
    },
  });

  const selectedTableState = useSetupTableState("assay-model-selected-metadata", tableColumns, {
    saveState: {
      columnSizing: true
    },
    settings: {
      disableColumnReorder: true,
      disableVisibilitySettings: true,
    },
  });

  const {
    data: selectedMetadataDefintions,
    isLoading: isSelectedMetadataDefintionsLoading,
    isError: isSelectedMetadataDefintionsError,
    error: selectedMetadataDefintionsError,
  } = useAssayMetadataDefinitionsByAssayModel(
    assayModelId,
    selectedTableState.sorting,
    selectedTableState.filters,
  );

  const {
    data: metadataDefinitions,
    isLoading: isMetadataDefinitionsLoading,
    isError: isMetadataDefinitionsError,
    error: metadataDefinitionsError,
  } = useAssayMetadataDefinitions(
    availableTableState.sorting,
    availableTableState.filters,
  );

  const availableMetadataDefinitions = useMemo(
    () =>
      metadataDefinitions?.filter(
        (d) => !selectedMetadataDefintions?.find((s) => s.id === d.id),
      ),
    [metadataDefinitions, selectedMetadataDefintions],
  );

  const createEntityMutation =
    useCreateEntityMutation<AssayMetadataDefinitionData>(
      "grit/assays/assay_model_metadata",
    );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_model_metadata",
  );

  const onAvailableRowClick = useCallback(
    async (row: Row<AssayMetadataDefinitionData>) => {
      await createEntityMutation.mutateAsync({
        assay_model_id: assayModelId,
        assay_metadata_definition_id: row.original.id,
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/assay_metadata_definitions",
        ],
      });
    },
    [queryClient],
  );

  const onSelectedRowClick = useCallback(
    async (row: Row<AssayMetadataDefinitionData>) => {
      await destroyEntityMutation.mutateAsync(
        (row.original as any).assay_model_metadatum_id,
      );
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/assay_metadata_definitions",
        ],
      });
    },
    [queryClient],
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "calc(var(--spacing) * 2 )",
        width: "100%",
        height: "100%",
      }}
    >
      <Table
        header="Selected"
        getRowId={getRowId}
        onRowClick={onSelectedRowClick}
        loading={isSelectedMetadataDefintionsLoading}
        tableState={selectedTableState}
        disableFooter
        data={selectedMetadataDefintions}
        noDataMessage={
          (isSelectedMetadataDefintionsError
            ? selectedMetadataDefintionsError
            : undefined) ?? "No metadata selected"
        }
      />
      <Table
        header="Available"
        getRowId={getRowId}
        onRowClick={onAvailableRowClick}
        headerActions={
          <Link to="..">
            <Button color="secondary">Done</Button>
          </Link>
        }
        loading={isMetadataDefinitionsLoading}
        tableState={availableTableState}
        disableFooter
        data={availableMetadataDefinitions}
        noDataMessage={
          (isMetadataDefinitionsError ? metadataDefinitionsError : undefined) ??
          "No more metadata available"
        }
      />
    </div>
  );
};

const AssayModelMetadata = ({
  columns,
  assayModelId,
}: {
  assayModelId: string | number;
  columns: EntityPropertyDef[];
}) => {
  const tableColumns = useTableColumns(columns);
  const tableState = useSetupTableState("assay-model-metadat", tableColumns, {
    saveState: {
      columnSizing: true
    },
    settings: {
      disableColumnReorder: true,
      disableVisibilitySettings: true,
    },
  });

  const {
    data: modelMetadata,
    isLoading: isModelMetadataLoading,
    isError: isModelMetadataError,
    error: modelMetadataError,
  } = useAssayMetadataDefinitionsByAssayModel(
    assayModelId,
    tableState.sorting,
    tableState.filters,
  );

  return (
    <Table
      headerActions={
        <Link to="edit">
          <Button>Edit</Button>
        </Link>
      }
      getRowId={getRowId}
      loading={isModelMetadataLoading}
      tableState={tableState}
      disableFooter
      data={modelMetadata}
      noDataMessage={
        (isModelMetadataError ? modelMetadataError : undefined) ??
        "No metadata selected"
      }
    />
  );
};

const Metadata = () => {
  const { assay_model_id } = useParams() as { assay_model_id: string };
  const {
    data: columns,
    isLoading,
    isError,
    error,
  } = useAssayMetadataDefinitionColumns();

  if (isLoading) {
    return <Spinner />;
  }

  if (isError || !columns) {
    return <ErrorPage error={error} />;
  }

  return (
    <Routes>
      <Route
        index
        element={
          <AssayModelMetadata columns={columns} assayModelId={assay_model_id} />
        }
      />
      <Route
        path="edit"
        element={
          <AssayMetadataDefinitionSelector
            columns={columns}
            assayModelId={assay_model_id}
          />
        }
      />
    </Routes>
  );
};

export default Metadata;
