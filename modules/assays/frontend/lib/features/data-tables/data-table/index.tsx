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
  useDataTableRowColumns,
  useDataTableRows,
} from "../queries/data_table_rows";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import { useDataTable, useDataTableFields } from "../queries/data_tables";
import DataTableTabs from "./DataTableTabs";
import { useDataTableEntityColumns } from "../queries/data_table_entities";
import { useDataTableColumnColumns } from "../queries/data_table_columns";
import DataTableData from "./data";
import DataTablePlots from "./plots";
import DataTableEntities from "./entities";
import DataTableDetails from "./details";
import DataTableColumns from "./columns";

const DataTablePage = () => {
  const { data_table_id } = useParams() as { data_table_id: string };
  const {
    isLoading: isDataTableLoading,
    isError: isDataTableError,
    error: dataTableError,
  } = useDataTable(data_table_id);
  const {
    isLoading: isDataTableFieldsLoading,
    isError: isDataTableFieldsError,
    error: dataTableFieldsError,
  } = useDataTableFields();
  const {
    isLoading: isRowsLoading,
    isError: isRowsError,
    error: rowsError,
  } = useDataTableRows(data_table_id, undefined, undefined, undefined, {
    enabled: data_table_id !== "new",
  });
  const {
    isLoading: isColumnsLoading,
    isError: isColumnsError,
    error: columnsError,
  } = useDataTableRowColumns(
    { data_table_id },
    {
      enabled: data_table_id !== "new",
    },
  );
  const {
    isLoading: isDataTableEntityColumnsLoading,
    isError: isDataTableEntityColumnsError,
    error: dataTableEntityColumnsError,
  } = useDataTableEntityColumns(data_table_id, undefined, {
    enabled: data_table_id !== "new",
  });
  const {
    isLoading: isDataTableColumnColumnsLoading,
    isError: isDataTableColumnColumnsError,
    error: dataTableColumnColumnsError,
  } = useDataTableColumnColumns(undefined, {
    enabled: data_table_id !== "new",
  });

  if (
    isRowsLoading ||
    isColumnsLoading ||
    isDataTableLoading ||
    isDataTableFieldsLoading ||
    isDataTableEntityColumnsLoading ||
    isDataTableColumnColumnsLoading
  )
    return <Spinner />;

  if (
    isRowsError ||
    isColumnsError ||
    isDataTableError ||
    isDataTableFieldsError ||
    isDataTableEntityColumnsError ||
    isDataTableColumnColumnsError
  ) {
    return (
      <ErrorPage
        error={
          rowsError ??
          columnsError ??
          dataTableError ??
          dataTableFieldsError ??
          dataTableEntityColumnsError ??
          dataTableColumnColumnsError
        }
      />
    );
  }

  if (data_table_id === "new")
    return <DataTableDetails dataTableId={data_table_id} />;

  return (
    <Routes>
      <Route element={<DataTableTabs />}>
        <Route
          path="details"
          element={<DataTableDetails dataTableId={data_table_id} />}
        />
        <Route
          path="data"
          element={<DataTableData dataTableId={data_table_id} />}
        />
        <Route
          path="plots/*"
          element={<DataTablePlots dataTableId={data_table_id} />}
        />
        <Route path="entities/*" element={<DataTableEntities dataTableId={data_table_id} />} />
        <Route path="columns/*" element={<DataTableColumns dataTableId={data_table_id} />} />
        <Route index element={<Navigate to="data" replace />} />
      </Route>
    </Routes>
  );
};

export default DataTablePage;
