/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/assays.
 *
 * @grit42/assays is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/assays is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/assays. If not, see <https://www.gnu.org/licenses/>.
 */

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
