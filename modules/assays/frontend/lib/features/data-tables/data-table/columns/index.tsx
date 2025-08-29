import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { Route, Routes } from "react-router-dom";
import DataTableColumnsTable from "./DataTableColumnsTable";
import DataTableColumnSelector from "./DataTableColumnSelector";
import DataTableColumn from "./DataTableColumn";
import { useDataTableColumnColumns } from "../../queries/data_table_columns";
import { useAssayDataSheetColumnColumns } from "../../../../queries/assay_data_sheet_columns";

const DataTableColumns = ({
  dataTableId,
}: {
  dataTableId: string | number;
}) => {
  const {
    data: dataTableColumnColumns,
    isLoading: isDataTableColumnColumnsLoading,
    isError: isDataTableColumnColumnsError,
    error: dataTableColumnError,
  } = useDataTableColumnColumns();
  const {
    data: dataSheetColumnColumns,
    isLoading: isDataSheetColumnColumnsLoading,
    isError: isDataSheetColumnColumnsError,
    error: dataSheetColumnError,
  } = useAssayDataSheetColumnColumns();

  if (isDataSheetColumnColumnsLoading || isDataTableColumnColumnsLoading) {
    return <Spinner />;
  }

  if (
    isDataTableColumnColumnsError ||
    !dataTableColumnColumns ||
    isDataSheetColumnColumnsError ||
    !dataSheetColumnColumns
  ) {
    return <ErrorPage error={dataTableColumnError ?? dataSheetColumnError} />;
  }

  return (
    <Routes>
      <Route
        index
        element={<DataTableColumnsTable dataTableId={dataTableId} />}
      />
      <Route path="edit/:data_table_column_id" element={<DataTableColumn />} />
      <Route
        path="select"
        element={<DataTableColumnSelector dataTableId={dataTableId} />}
      />
    </Routes>
  );
};

export default DataTableColumns;
