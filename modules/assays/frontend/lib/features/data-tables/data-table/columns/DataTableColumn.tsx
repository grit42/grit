/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { useParams } from "react-router-dom";
import { ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  useDataTableColumn,
  useDataTableColumnFields,
} from "../../queries/data_table_columns";
import DataTableColumnForm from "./DataTableColumnForm";

export const DataTableColumn = () => {
  const { data_table_column_id } = useParams() as {
    data_table_column_id: string;
  };

  const {
    data: dataTableColumn,
    isLoading: isDataTableColumnLoading,
    isError: isDataTableColumnError,
    error: dataTableColumnError,
  } = useDataTableColumn(data_table_column_id);
  const {
    data: dataTableColumnFields,
    isLoading: isDataTableColumnFieldsLoading,
    isError: isDataTableColumnFieldsError,
    error: dataTableColumnFieldsError,
  } = useDataTableColumnFields(undefined, {
    select: (fields) =>
      fields.filter(
        (f) =>
          ![
            "data_table_id",
            "assay_data_sheet_column_id",
            "pivots",
            // "sort",
            // "aggregation_method",
          ].includes(f.name),
      ),
  });

  if (isDataTableColumnLoading || isDataTableColumnFieldsLoading)
    return <Spinner />;

  if (
    isDataTableColumnError ||
    !dataTableColumn ||
    isDataTableColumnFieldsError ||
    !dataTableColumnFields
  ) {
    return (
      <ErrorPage error={dataTableColumnError ?? dataTableColumnFieldsError} />
    );
  }

  return (
    <DataTableColumnForm
      fields={dataTableColumnFields}
      dataTableColumn={dataTableColumn}
    />
  );
};

export default DataTableColumn;
