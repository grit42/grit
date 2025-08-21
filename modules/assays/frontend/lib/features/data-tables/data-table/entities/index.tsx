import { ErrorPage, Spinner } from "@grit42/client-library/components";
import { Route, Routes, useParams } from "react-router-dom";
import DataTableEntitiesTable from "./DataTableEntitiesTable";
import {
  useDataTableEntityColumns,
} from "../../queries/data_table_entities";
import DataTableEntitySelector from "./DataTableEntitySelector";


const Entities = () => {
  const { data_table_id } = useParams() as { data_table_id: string };
  const {
    data: columns,
    isLoading,
    isError,
    error,
  } = useDataTableEntityColumns(data_table_id);

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
        element={<DataTableEntitiesTable dataTableId={data_table_id} />}
      />
      <Route
        path="edit"
        element={
          <DataTableEntitySelector
            dataTableId={data_table_id}
          />
        }
      />
    </Routes>
  );
};

export default Entities;
