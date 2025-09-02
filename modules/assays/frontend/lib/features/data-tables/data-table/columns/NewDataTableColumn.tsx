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

import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import {
  useAssayDataSheetColumnPivotOptions,
  useDataTableColumnFields,
} from "../../queries/data_table_columns";
import DataTableColumnForm from "./DataTableColumnForm";
import { useAssayDataSheetColumn } from "../../../../queries/assay_data_sheet_columns";

export const NewDataTableColumn = () => {
  const { data_table_id } = useParams() as {
    data_table_id: string;
  };

  const [urlSearchParams] = useSearchParams();

  const assay_data_sheet_column_id = urlSearchParams.get(
    "assay_data_sheet_column_id",
  );

  const {
    data: dataTableColumn,
    isLoading: isDataTableColumnLoading,
    isError: isDataTableColumnError,
    error: dataTableColumnError,
  } = useAssayDataSheetColumn(assay_data_sheet_column_id!, undefined, {
    select: (data) =>
      data ? { ...data, assay_data_sheet_column_id, data_table_id } : null,
  });

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

  const {
    data: pivotOptions,
    isLoading: isPivotOptionsLoading,
    isError: isPivotOptionsError,
    error: pivotOptionsError,
  } = useAssayDataSheetColumnPivotOptions(assay_data_sheet_column_id!);

  if (!assay_data_sheet_column_id) {
    return (
      <ErrorPage error="'assay_data_sheet_column_id' not specified">
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  if (
    isDataTableColumnLoading ||
    isDataTableColumnFieldsLoading ||
    isPivotOptionsLoading
  )
    return <Spinner />;

  if (
    isDataTableColumnError ||
    !dataTableColumn ||
    isDataTableColumnFieldsError ||
    !dataTableColumnFields ||
    isPivotOptionsError ||
    !pivotOptions
  ) {
    return (
      <ErrorPage
        error={
          dataTableColumnError ??
          dataTableColumnFieldsError ??
          pivotOptionsError
        }
      />
    );
  }

  return (
    <DataTableColumnForm
      fields={dataTableColumnFields}
      dataTableColumn={dataTableColumn}
      pivotOptions={pivotOptions}
    />
  );
};

export default NewDataTableColumn;
