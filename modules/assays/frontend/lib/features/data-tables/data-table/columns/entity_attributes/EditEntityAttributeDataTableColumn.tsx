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
import { useDataTableColumnFields } from "../../../queries/data_table_columns";
import { useEntityDatum } from "@grit42/core";
import EntityAttributeDataTableColumnForm from "./EntityAttributeDataTableColumnForm";

const EditEntityAttributeDataTableColumn = () => {
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
    select: (fields) =>
      fields
        .filter(
          (f) =>
            ![
              "data_table_id",
              "assay_data_sheet_column_id",
              "source_type",
              "experiment_ids",
              "metadata_filters",
              "aggregation_method",
            ].includes(f.name),
        )
        .map((f) =>
          f.name === "entity_attribute_name" ? { ...f, disabled: true } : f,
        ),
  });

  if (isLoading || isDataTableColumnFieldsLoading) return <Spinner />;
  if (
    isError ||
    !data ||
    isDataTableColumnFieldsError ||
    !dataTableColumnFields
  ) {
    return (
      <ErrorPage error={error ?? dataTableColumnFieldsError}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  }

  return (
    <EntityAttributeDataTableColumnForm
      dataTableId={data_table_id}
      dataTableColumnId={data_table_column_id}
      dataTableColumn={data}
      fields={dataTableColumnFields}
    />
  );
};

export default EditEntityAttributeDataTableColumn;
