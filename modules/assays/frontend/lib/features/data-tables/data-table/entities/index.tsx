import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { Route, Routes } from "react-router-dom";
import DataTableEntitiesTable from "./DataTableEntitiesTable";
import {
  useDataTableEntityColumns,
} from "../../queries/data_table_entities";
import DataTableEntitySelector from "./DataTableEntitySelector";


const DataTableEntities = ({ dataTableId }: { dataTableId: string | number }) => {
  const {
    data: columns,
    isLoading,
    isError,
    error,
  } = useDataTableEntityColumns(dataTableId);

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
        element={<DataTableEntitiesTable dataTableId={dataTableId} />}
      />
      <Route
        path="edit"
        element={
          <DataTableEntitySelector
            dataTableId={dataTableId}
          />
        }
      />
    </Routes>
  );
};

export default DataTableEntities;
