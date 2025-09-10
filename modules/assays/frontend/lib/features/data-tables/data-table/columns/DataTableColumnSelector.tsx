import { Button } from "@grit42/client-library/components";
import { createSearchParams, Link, useNavigate } from "react-router-dom";
import {
  DataTableColumnData,
  useAvailableDataTableColumns,
} from "../../queries/data_table_columns";
import { useTableColumns } from "@grit42/core/utils";
import { Table, useSetupTableState } from "@grit42/table";
import {
  AssayDataSheetColumnData,
  useAssayDataSheetColumnColumns,
} from "../../../../queries/assay_data_sheet_columns";
import { EntityPropertyDef } from "@grit42/core";

const getRowId = (data: DataTableColumnData | AssayDataSheetColumnData) =>
  `${data.assay_model_id}-${data.assay_id}-${data.id}`;

const DataTableColumnSelector = ({
  dataTableId,
}: {
  dataTableId: string | number;
}) => {
  const navigate = useNavigate();

  const { data: dataSheetColumnColumns } = useAssayDataSheetColumnColumns(
    undefined,
    {
      select: (data): EntityPropertyDef[] =>
        data
          ? [
              {
                display_name: "Assay model",
                name: "assay_model_name",
                type: "string",
                default_hidden: false,
                required: false,
                unique: false,
              },
              {
                display_name: "Assay",
                name: "assay_name",
                type: "string",
                default_hidden: false,
                required: false,
                unique: false,
              },
              ...data,
            ]
          : [],
    },
  );
  const availableTableColumns = useTableColumns<AssayDataSheetColumnData>(
    dataSheetColumnColumns,
  );

  const availableTableState = useSetupTableState(
    "data-table-available-columns",
    availableTableColumns,
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
    data: availableDataTableColumns,
    isLoading: isAvailableDataTableColumnsLoading,
    isError: isAvailableDataTableColumnsError,
    error: availableDataTableColumnsError,
  } = useAvailableDataTableColumns(
    dataTableId,
    availableTableState.sorting,
    availableTableState.filters,
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr",
        margin: "auto",
        maxWidth: "100%",
        height: "100%",
        overflow: "auto",
      }}
    >
      <Table<AssayDataSheetColumnData>
        header="Available"
        getRowId={getRowId}
        onRowClick={(row) =>
          navigate(
            {
              pathname: "new",
              search: createSearchParams({
                assay_data_sheet_column_id: row.original.id.toString(),
              }).toString(),
            },
            {
              state: {
                assay_data_sheet_column: row.original,
              },
            },
          )
        }
        headerActions={
          <Link to="..">
            <Button color="primary">Cancel</Button>
          </Link>
        }
        loading={isAvailableDataTableColumnsLoading}
        tableState={availableTableState}
        disableFooter
        data={availableDataTableColumns}
        noDataMessage={
          (isAvailableDataTableColumnsError
            ? availableDataTableColumnsError
            : undefined) ?? "No more columns available"
        }
      />
    </div>
  );
};

export default DataTableColumnSelector;
