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
import { DataTableColumnData, useDataTableColumnFields } from "../../../queries/data_table_columns";
import EntityAttributeDataTableColumnForm from "./EntityAttributeDataTableColumnForm";
import { useMemo } from "react";

const NewEntityAttributeDataTableColumn = () => {
  const { data_table_id } = useParams() as {
    data_table_id: string;
    data_table_column_id: string;
  };
  const [searchParams] = useSearchParams();

  const {
    data: dataTableColumnFields,
    isLoading: isDataTableColumnFieldsLoading,
    isError: isDataTableColumnFieldsError,
    error: dataTableColumnFieldsError,
  } = useDataTableColumnFields(undefined, {
    select: (fields) =>
      fields
        .filter(
          (f) =>
            ![
              "data_table_id",
              "assay_data_sheet_column_id",
              "source_type",
              "pivots",
              "aggregation_method",
            ].includes(f.name),
        )
        .map((f) =>
          f.name === "entity_attribute_name" ? { ...f, disabled: true } : f,
        ),
  });

  const dataTableColumn = useMemo(
    () => ({
      name: searchParams.get("entity_attribute_name"),
      safe_name: searchParams.get("entity_attribute_safe_name"),
      entity_attribute_name: searchParams.get("entity_attribute_safe_name"),
      source_type: "entity_attribute",
    } as Partial<DataTableColumnData>),
    [searchParams],
  );
  if (!searchParams.has("entity_attribute_safe_name")) {
    return (
      <ErrorPage error="'entity_attribute_safe_name' not specified">
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  if (isDataTableColumnFieldsLoading) return <Spinner />;
  if (
    !dataTableColumn ||
    isDataTableColumnFieldsError ||
    !dataTableColumnFields
  ) {
    return (
      <ErrorPage error={dataTableColumnFieldsError}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <EntityAttributeDataTableColumnForm
      dataTableId={data_table_id}
      dataTableColumnId="new"
      dataTableColumn={dataTableColumn}
      fields={dataTableColumnFields}
    />
  );
};

export default NewEntityAttributeDataTableColumn;
