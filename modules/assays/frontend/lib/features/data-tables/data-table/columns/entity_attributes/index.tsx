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
import {
  Route,
  Routes,
  useParams,
} from "react-router-dom";
import EntityAttributeDataTableColumnsTable from "./EntityAttributeDataTableColumnsTable";
import EntityAttributeDataTableColumnSelector from "./EntityAttributeDataTableColumnSelector";
import {
  useDataTableColumnColumns,
} from "../../../queries/data_table_columns";
import { useAssayDataSheetColumnColumns } from "../../../../../queries/assay_data_sheet_columns";
import NewEntityAttributeDataTableColumn from "./NewEntityAttributeDataTableColumn";
import EditEntityAttributeDataTableColumn from "./EditEntityAttributeDataTableColumn";

const AssayDataSheetDataTableColumn = () => {
  const { data_table_column_id } = useParams();
  if (data_table_column_id === "new")
    return <NewEntityAttributeDataTableColumn />;
  return <EditEntityAttributeDataTableColumn />;
};

const EntityAttributeDataTableColumns = ({
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
        element={<EntityAttributeDataTableColumnsTable dataTableId={dataTableId} />}
      />
      <Route
        path="select"
        element={<EntityAttributeDataTableColumnSelector dataTableId={dataTableId} />}
      />
      <Route
        path=":data_table_column_id"
        element={<AssayDataSheetDataTableColumn />}
      />
    </Routes>
  );
};

export default EntityAttributeDataTableColumns;
