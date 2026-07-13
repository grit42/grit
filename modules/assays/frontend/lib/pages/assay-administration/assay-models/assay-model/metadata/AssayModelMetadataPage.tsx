import { Button } from "@grit42/client-library/components";
import { EntityData } from "@grit42/core";
import {
  AssayMetadataDefinitionData,
  useAssayMetadataDefinitionsByAssayModel,
} from "../../../../../queries/assay_metadata_definitions";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { Link } from "react-router-dom";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";
import styles from "./metadata.module.scss";

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

const AssayModelMetadataPage = () => {
  const { canEdit, assayModel } = useAssayModelEditorContext();
  const tableState = useSetupTableState("assay-model-metadat", COLUMNS, {
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
    assayModel.id,
    tableState.sorting,
    tableState.filters,
  );

  return (
    <Table
      header="Selected metadata definitions"
      className={styles.metadataTable}
      headerActions={
        canEdit ? (
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
        ((isModelMetadataError ? modelMetadataError : undefined) ?? canEdit)
          ? "No metadata definitions selected"
          : "This assay model does not require metadata definitions"
      }
    />
  );
};

export default AssayModelMetadataPage;
