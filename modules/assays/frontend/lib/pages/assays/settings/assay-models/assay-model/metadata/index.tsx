import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  EntityPropertyDef,
  EntityData,
  useCreateEntityMutation,
  useDestroyEntityMutation,
} from "@grit42/core";
import { useCallback, useMemo } from "react";
import {
  AssayMetadataDefinitionData,
  useAssayMetadataDefinitionColumns,
  useAssayMetadataDefinitions,
  useAssayMetadataDefinitionsByAssayModel,
} from "../../../../../../queries/assay_metadata_definitions";
import { Row, Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { Link, Route, Routes, useParams } from "react-router-dom";
import {
  AssayModelData,
  useAssayModel,
} from "../../../../../../queries/assay_models";
import { useQueryClient } from "@grit42/api";

const getRowId = (data: EntityData) => data.id.toString();

const AssayMetadataDefinitionSelector = ({
  columns,
  assayModelId,
}: {
  assayModelId: string | number;
  columns: EntityPropertyDef<AssayMetadataDefinitionData>[];
}) => {
  const queryClient = useQueryClient();
  const tableColumns = useTableColumns(columns);
  const availableTableState = useSetupTableState(
    "assay-model-available-metadata",
    tableColumns,
    {
      saveState: {
        columnSizing: true,
      },
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
    },
  );

  const selectedTableState = useSetupTableState(
    "assay-model-selected-metadata",
    tableColumns,
    {
      saveState: {
        columnSizing: true,
      },
      settings: {
        disableColumnReorder: true,
        disableVisibilitySettings: true,
      },
    },
  );

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
    [assayModelId, createEntityMutation, queryClient],
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
    [destroyEntityMutation, queryClient],
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
  assayModel,
}: {
  assayModelId: string | number;
  columns: EntityPropertyDef[];
  assayModel: AssayModelData;
}) => {
  const tableColumns = useTableColumns(columns);
  const tableState = useSetupTableState("assay-model-metadat", tableColumns, {
    saveState: {
      columnSizing: true,
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
        assayModel?.publication_status_id__name !== "Published" ? (
          <Link to="edit">
            <Button>Edit</Button>
          </Link>
        ) : undefined
      }
      getRowId={getRowId}
      loading={isModelMetadataLoading}
      tableState={tableState}
      disableFooter
      data={modelMetadata}
      noDataMessage={
        (isModelMetadataError ? modelMetadataError : undefined) ??
        assayModel?.publication_status_id__name !== "Published"
          ? "No metadata selected"
          : "This assay model does not define any metadata"
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
  const {
    data: assayModel,
    isLoading: isAssayModelLoading,
    isError: isAssayModelError,
    error: assayModelError,
  } = useAssayModel(assay_model_id);

  if (isLoading || isAssayModelLoading) {
    return <Spinner />;
  }

  if (isError || !columns || isAssayModelError || !assayModel) {
    return <ErrorPage error={error ?? assayModelError} />;
  }

  return (
    <Routes>
      <Route
        index
        element={
          <AssayModelMetadata
            columns={columns}
            assayModelId={assay_model_id}
            assayModel={assayModel}
          />
        }
      />
      {assayModel?.publication_status_id__name !== "Published" && (
        <Route
          path="edit"
          element={
            <AssayMetadataDefinitionSelector
              columns={columns}
              assayModelId={assay_model_id}
            />
          }
        />
      )}
    </Routes>
  );
};

export default Metadata;
