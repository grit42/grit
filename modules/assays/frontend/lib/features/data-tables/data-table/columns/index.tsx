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
import { Navigate, Route, Routes } from "react-router-dom";
import AssayDataSheetDataTableColumns from "./assay_data_sheet_columns";
import DataTableColumnsTabs from "./DataTableColumnsTabs";
import { useAssayDataSheetColumnColumns } from "../../../../queries/assay_data_sheet_columns";
import { useDataTableColumnColumns } from "../../queries/data_table_columns";
import EntityAttributeDataTableColumns from "./entity_attributes";

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
      <Route element={<DataTableColumnsTabs />}>
        <Route
          path="assay/*"
          element={<AssayDataSheetDataTableColumns dataTableId={dataTableId} />}
        />
        <Route
          path="entity/*"
          element={<EntityAttributeDataTableColumns dataTableId={dataTableId} />}
        />
        <Route path="*" element={<Navigate to="assay" replace />} />
      </Route>
    </Routes>
  );
};

export default DataTableColumns;
