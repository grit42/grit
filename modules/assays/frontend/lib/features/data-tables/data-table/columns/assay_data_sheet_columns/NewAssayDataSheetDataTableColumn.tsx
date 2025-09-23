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
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  DataTableColumnData,
  useAssayDataSheetColumnPivotOptions,
  useDataTableColumnFields,
} from "../../../queries/data_table_columns";
import { useEntityDatum } from "@grit42/core";
import AssayDataSheetDataTableColumnForm from "./AssayDataSheetDataTableColumnForm";
import { useMemo } from "react";

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

const NewAssayDataSheetDataTableColumn = () => {
  const { data_table_id } = useParams() as {
    data_table_id: string;
    data_table_column_id: string;
  };
  const [searchParams] = useSearchParams();
  const { data, isLoading, isError, error } = useEntityDatum(
    "grit/assays/assay_data_sheet_columns",
    searchParams.get("assay_data_sheet_column_id") ?? -1,
    undefined,
    {
      enabled: searchParams.has("assay_data_sheet_column_id"),
    },
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
  } = useAssayDataSheetColumnPivotOptions(
    searchParams.get("assay_data_sheet_column_id") ?? -1,
    undefined,
    {
      enabled: searchParams.has("assay_data_sheet_column_id"),
    },
  );

  const dataTableColumn = useMemo(
    () =>
      data
        ? ({
            name: data.name,
            safe_name: data.safe_name,
            assay_data_sheet_column_id: data.id,
            assay_data_sheet_column_id__name: data.name,
            assay_model_id: data.assay_model_id,
            assay_model_id__name: data.assay_model_id__name,
            assay_data_sheet_definition_id__name:
              data.assay_data_sheet_definition_id__name,
            data_type_id: data.data_type_id,
            data_type_id__name: data.data_type_id__name,
            source_type: "assay_data_sheet_column",
            aggregation_method: AGGREGATE_METHODS_FOR_DATA_TYPE(
              data?.data_type_id__name as string | undefined,
            )[0]?.value,
          } as Partial<DataTableColumnData>)
        : null,
    [data],
  );

  if (!searchParams.has("assay_data_sheet_column_id")) {
    return (
      <ErrorPage error="'assay_data_sheet_column_id' not specified">
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  if (isLoading || isDataTableColumnFieldsLoading || isPivotOptionsLoading)
    return <Spinner />;
  if (
    isError ||
    !dataTableColumn ||
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
      dataTableColumnId="new"
      dataTableColumn={dataTableColumn}
      fields={dataTableColumnFields}
      pivotOptions={pivotOptions}
    />
  );
};

export default NewAssayDataSheetDataTableColumn;
