import { ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  EntityPropertyDef,
} from "@grit42/core";
import {
  useAssayMetadataDefinitionColumns,
  useAssayMetadataDefinitionsByAssayModel,
} from "../../../../queries/assay_metadata_definitions";
import { Table, useSetupTableState } from "@grit42/table";
import { useTableColumns } from "@grit42/core/utils";
import { useParams } from "react-router-dom";


const AssayModelMetadataTable = ({
  columns,
  assayModelId,
}: {
  assayModelId: string | number;
  columns: EntityPropertyDef[];
}) => {
  const tableColumns = useTableColumns(columns);
  const tableState = useSetupTableState("assay-model-metadata", tableColumns, {
    saveState: {
      columnSizing: true,
    },
    settings: {
      disableColumnReorder: true,
      disableVisibilitySettings: true,
      disableFilters: true,
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
      loading={isModelMetadataLoading}
      tableState={tableState}
      disableFooter
      data={modelMetadata}
      noDataMessage={
        (isModelMetadataError ? modelMetadataError : undefined) ??
        "This assay model does not define any metadata"
      }
    />
  );
};

const AssayModelMetadata = () => {
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
    <AssayModelMetadataTable columns={columns} assayModelId={assay_model_id} />
  );
};

export default AssayModelMetadata;
