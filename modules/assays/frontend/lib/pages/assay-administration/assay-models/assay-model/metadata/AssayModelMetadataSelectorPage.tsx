import { Button } from "@grit42/client-library/components";
import styles from "./metadata.module.scss";
import {
  EntityData,
  useCreateEntityMutation,
  useDangerousDestroyEntityMutation,
} from "@grit42/core";
import { useCallback, useMemo } from "react";
import {
  AssayMetadataDefinitionData,
  useAssayMetadataDefinitions,
  useAssayMetadataDefinitionsByAssayModel,
} from "../../../../../queries/assay_metadata_definitions";
import { GritColumnDef, Row, Table, useSetupTableState } from "@grit42/table";
import { Link } from "react-router-dom";
import { useQueryClient } from "@grit42/api";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";

const getRowId = (data: EntityData) => data.id.toString();

const COLUMNS: GritColumnDef<AssayMetadataDefinitionData>[] = [
  {
    id: "id",
    accessorKey: "id",
    header: "Id",
    type: "integer",
    defaultVisibility: "hidden",
  },
  {
    id: "created_by",
    accessorKey: "created_by",
    header: "Created by",
    type: "string",
    defaultVisibility: "hidden",
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    header: "Created at",
    type: "datetime",
    defaultVisibility: "hidden",
  },
  {
    id: "updated_by",
    accessorKey: "updated_by",
    header: "Updated by",
    type: "string",
    defaultVisibility: "hidden",
  },
  {
    id: "updated_at",
    accessorKey: "updated_at",
    header: "Updated at",
    type: "datetime",
    defaultVisibility: "hidden",
  },
  {
    id: "name",
    accessorKey: "name",
    header: "Name",
    type: "string",
    size: 200,
  },
  {
    id: "safe_name",
    accessorKey: "safe_name",
    header: "Safe name",
    type: "string",
    size: 200,
  },
  {
    id: "description",
    accessorKey: "description",
    header: "Description",
    type: "text",
    size: 750,
  },
  {
    id: "vocabulary_id__name",
    accessorKey: "vocabulary_id__name",
    header: "Vocabulary",
    type: "entity",
    entity: {
      full_name: "Grit::Core::Vocabulary",
      name: "Vocabulary",
      path: "grit/core/vocabularies",
      primary_key: "id",
      primary_key_type: "integer",
      column: "vocabulary_id",
      display_column: "name",
      display_column_type: "string",
    },
  } as GritColumnDef<AssayMetadataDefinitionData>,
];

const AssayMetadataDefinitionSelectorPage = () => {
  const { dangerousEditMode, assayModel } = useAssayModelEditorContext();
  const queryClient = useQueryClient();
  const availableTableState = useSetupTableState(
    "assay-model-available-metadata",
    COLUMNS,
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

  const selectedTableState = useSetupTableState<AssayMetadataDefinitionData>(
    "assay-model-selected-metadata",
    COLUMNS,
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
    assayModel.id,
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

  const destroyEntityMutation = useDangerousDestroyEntityMutation(
    "grit/assays/assay_model_metadata",
  );

  const onAvailableRowClick = useCallback(
    async (row: Row<AssayMetadataDefinitionData>) => {
      await createEntityMutation.mutateAsync({
        assay_model_id: assayModel.id,
        assay_metadata_definition_id: row.original.id,
        dangerous_edit: dangerousEditMode ?? undefined,
      });
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/assay_metadata_definitions",
        ],
      });
    },
    [assayModel.id, createEntityMutation, dangerousEditMode, queryClient],
  );

  const onSelectedRowClick = useCallback(
    async (row: Row<AssayMetadataDefinitionData>) => {
      await destroyEntityMutation.mutateAsync([
        row.original.assay_model_metadatum_id,
        dangerousEditMode,
      ]);
      await queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          "grit/assays/assay_metadata_definitions",
        ],
      });
    },
    [dangerousEditMode, destroyEntityMutation, queryClient],
  );

  return (
    <div className={styles.metadataSelector}>
      <Table
        header="Selected metadata definitions"
        getRowId={getRowId}
        onRowClick={onSelectedRowClick}
        loading={isSelectedMetadataDefintionsLoading}
        tableState={selectedTableState}
        disableFooter
        data={selectedMetadataDefintions}
        noDataMessage={
          (isSelectedMetadataDefintionsError
            ? selectedMetadataDefintionsError
            : undefined) ?? "No metadata definitions selected"
        }
      />
      <Table
        header="Available metadata definitions"
        getRowId={getRowId}
        onRowClick={onAvailableRowClick}
        headerActions={
          <Link to=".." relative="path">
            <Button color="secondary">Done</Button>
          </Link>
        }
        loading={isMetadataDefinitionsLoading}
        tableState={availableTableState}
        disableFooter
        data={availableMetadataDefinitions}
        noDataMessage={
          (isMetadataDefinitionsError ? metadataDefinitionsError : undefined) ??
          "No more metadata definitions available"
        }
      />
    </div>
  );
};

export default AssayMetadataDefinitionSelectorPage;
