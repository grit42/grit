import {
  Button,
  ButtonGroup,
  ErrorPage,
} from "@grit42/client-library/components";
import { EntityData } from "@grit42/core";
import { GritColumnDef, Table, useSetupTableState } from "@grit42/table";
import { Link, useNavigate } from "react-router-dom";
import { useAssayModelEditorContext } from "../AssayModelEditorContext";
import {
  AssayDataSheetDefinitionData,
  useAssayDataSheetDefinitions,
} from "../../../../../queries/assay_data_sheet_definitions";

const getRowId = (data: EntityData) => data.id.toString();

const COLUMNS: GritColumnDef<AssayDataSheetDefinitionData>[] = [
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
    id: "description",
    accessorKey: "description",
    header: "Description",
    type: "text",
    size: 750,
  },
  {
    id: "result",
    accessorKey: "result",
    header: "Result",
    type: "boolean",
    size: 100,
  },
  {
    id: "sort",
    accessorKey: "sort",
    header: "Sort",
    type: "integer",
    defaultVisibility: "hidden",
  },
];

const DataSheetDefinitionsPage = () => {
  const { canEdit, assayModel } = useAssayModelEditorContext();
  const navigate = useNavigate();
  const tableState = useSetupTableState(
    "assay-model-data-sheet-definitions",
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

  const data = useAssayDataSheetDefinitions(
    assayModel.id,
    tableState.sorting,
    tableState.filters,
  );

  const hasSheets = data.data?.length ?? 0 > 0;

  if (!hasSheets) {
    return (
      <ErrorPage error="No data sheet definitions yet">
        {canEdit && (
          <ButtonGroup>
            <Link to="new">
              <Button>New data sheet</Button>
            </Link>
            <Link to="import">
              <Button>Import data sheets from data files</Button>
            </Link>
          </ButtonGroup>
        )}
      </ErrorPage>
    );
  }

  return (
    <Table
      header="Data sheets"
      headerActions={
        canEdit && (
          <ButtonGroup>
            <Link to="new">
              <Button>New data sheet</Button>
            </Link>
            <Link to="import">
              <Button>Import data sheets from data files</Button>
            </Link>
          </ButtonGroup>
        )
      }
      onRowClick={({ id }) => navigate(id)}
      getRowId={getRowId}
      loading={data.isLoading}
      tableState={tableState}
      disableFooter
      data={data.data}
      noDataMessage={
        ((data.isError ? data.error : undefined) ?? canEdit)
          ? "This model does not define any data sheets."
          : "This assay model does not require metadata definitions"
      }
    />
  );
};

export default DataSheetDefinitionsPage;
