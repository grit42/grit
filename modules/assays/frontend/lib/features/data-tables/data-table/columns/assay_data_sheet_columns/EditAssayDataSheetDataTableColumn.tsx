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

import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { Link, useParams } from "react-router-dom";
import {
  useDataTableColumnFields,
  useDataTableColumnPivotOptions,
} from "../../../queries/data_table_columns";
import { useEntityDatum } from "@grit42/core";
import AssayDataSheetDataTableColumnForm from "./AssayDataSheetDataTableColumnForm";

const AGGREGATE_METHODS_FOR_DATA_TYPE = (dataTypeName?: string) => {
  if (!dataTypeName) return [];
  if (dataTypeName === "decimal" || dataTypeName === "integer") {
    return [
      { label: "Average", value: "avg" },
      { label: "Minimum", value: "min" },
      { label: "Maximum", value: "max" },
      { label: "Standard deviation", value: "stddev" },
      { label: "Latest", value: "latest" },
      { label: "Count", value: "count" },
    ];
  } else if (dataTypeName === "datetime" || dataTypeName === "date") {
    return [
      { label: "Minimum", value: "min" },
      { label: "Maximum", value: "max" },
      { label: "Latest", value: "latest" },
      { label: "Comma separated", value: "csv" },
      { label: "Count", value: "count" },
    ];
  } else if (dataTypeName === "boolean") {
    return [
      { label: "AND", value: "and" },
      { label: "OR", value: "or" },
      { label: "Latest", value: "latest" },
      { label: "Count", value: "count" },
    ];
  } else {
    return [
      { label: "Latest", value: "latest" },
      { label: "Comma separated", value: "csv" },
      { label: "Count", value: "count" },
    ];
  }
};

const EditAssayDataSheetDataTableColumn = () => {
  const { data_table_id, data_table_column_id } = useParams() as {
    data_table_id: string;
    data_table_column_id: string;
  };
  const { data, isLoading, isError, error } = useEntityDatum(
    "grit/assays/data_table_columns",
    data_table_column_id,
  );

  const {
    data: dataTableColumnFields,
    isLoading: isDataTableColumnFieldsLoading,
    isError: isDataTableColumnFieldsError,
    error: dataTableColumnFieldsError,
  } = useDataTableColumnFields(undefined, {
    select: (fields) => [
      {
        name: "assay_model_id__name",
        display_name: "Assay model",
        type: "string",
        disabled: true,
      },
      {
        name: "assay_data_sheet_definition_id__name",
        display_name: "Data sheet",
        type: "string",
        disabled: true,
      },
      {
        name: "assay_data_sheet_column_id__name",
        display_name: "Data sheet column",
        type: "string",
        disabled: true,
      },
      ...fields.filter(
        (f) =>
          ![
            "data_table_id",
            "assay_data_sheet_column_id",
            "entity_attribute_name",
            "source_type",
            "pivots",
            "aggregation_method",
          ].includes(f.name),
      ),
      {
        name: "aggregation_method",
        display_name: "Aggregation method",
        type: "select",
        required: true,
        select: {
          isClearable: true,
          options: AGGREGATE_METHODS_FOR_DATA_TYPE(
            data?.data_type_id__name as string | undefined,
          ),
        },
      },
    ],
  });

  const {
    data: pivotOptions,
    isLoading: isPivotOptionsLoading,
    isError: isPivotOptionsError,
    error: pivotOptionsError,
  } = useDataTableColumnPivotOptions(data_table_column_id);

  if (isLoading || isDataTableColumnFieldsLoading || isPivotOptionsLoading)
    return <Spinner />;
  if (
    isError ||
    !data ||
    isDataTableColumnFieldsError ||
    !dataTableColumnFields ||
    isPivotOptionsError ||
    !pivotOptions
  ) {
    return (
      <ErrorPage
        error={error ?? dataTableColumnFieldsError ?? pivotOptionsError}
      >
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <AssayDataSheetDataTableColumnForm
      dataTableId={data_table_id}
      dataTableColumnId={data_table_column_id}
      dataTableColumn={data}
      fields={dataTableColumnFields}
      pivotOptions={pivotOptions}
    />
  );
};

export default EditAssayDataSheetDataTableColumn;
