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
import { Outlet, Route, Routes } from "react-router-dom";
import DataTableColumnsTable from "./DataTableColumnsTable";
import DataTableColumnSelector from "./DataTableColumnSelector";
import DataTableColumn from "./DataTableColumn";
import { useDataTableColumnColumns } from "../../../queries/data_table_columns";
import { useAssayDataSheetColumnColumns } from "../../../../../queries/assay_data_sheet_columns";
import NewDataTableColumn from "./NewDataTableColumn";
import CloneDataTableColumn from "./CloneDataTableColumn";

const EntityDataTableColumns = ({
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
      <Route path="clone/:data_table_column_id" element={<CloneDataTableColumn />} />
      <Route path="select" element={<Outlet />}>
        <Route
          index
          element={<DataTableColumnSelector dataTableId={dataTableId} />}
        />
        <Route path=":data_table_column_id" element={<NewDataTableColumn />} />
      </Route>
    </Routes>
  );
};

export default EntityDataTableColumns;
