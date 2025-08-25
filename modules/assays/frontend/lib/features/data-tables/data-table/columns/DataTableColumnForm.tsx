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

import { useNavigate, useParams } from "react-router-dom";
import { Surface } from "@grit42/client-library/components";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import { useDestroyEntityMutation, useEditEntityMutation } from "@grit42/core";
import { DataTableColumnData } from "../../queries/data_table_columns";
import { useQueryClient } from "@grit42/api";
import { AssayModelMetadatumData } from "../../../../queries/assay_model_metadata";
import { useMemo } from "react";

const DataTableColumnForm = ({
  fields,
  dataTableColumn,
  pivotOptions,
}: {
  fields: FormFieldDef[];
  dataTableColumn: Partial<DataTableColumnData>;
  pivotOptions: AssayModelMetadatumData[];
}) => {
  const queryClient = useQueryClient();
  const { data_table_column_id, data_table_id } = useParams() as {
    data_table_column_id: string;
    data_table_id: string;
  };
  const navigate = useNavigate();

  const editEntityMutation = useEditEntityMutation<DataTableColumnData>(
    "grit/assays/data_table_columns",
    dataTableColumn.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/data_table_columns",
  );

  const defaultValue = useMemo(
    () => ({
      ...dataTableColumn,
      ...(dataTableColumn.pivots ?? []).reduce(
        (acc, p) => ({
          ...acc,
          [`pivot-${p}`]: true,
        }),
        {},
      ),
    }),
    [dataTableColumn],
  );

  const form = useForm<Partial<DataTableColumnData>>({
    defaultValues: defaultValue,
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const pivots = [];
      for (const key in formValue) {
        if (key.startsWith("pivot-") && formValue[key]) {
          pivots.push(Number(key.split("-")[1]));
        }
      }

      const value = {
        ...getVisibleFieldData<Partial<DataTableColumnData>>(formValue, fields),
        data_table_column_id: Number(data_table_column_id),
        pivots,
      };
      await editEntityMutation.mutateAsync(value as DataTableColumnData);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["entities", "columns", "Grit::Assays::DataTableRow"],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "data",
            `grit/assays/data_tables/${data_table_id}/data_table_rows`,
          ],
        }),
      ]);
      navigate("..");
    }),
  });

  const onDelete = async () => {
    if (
      !dataTableColumn.id ||
      !window.confirm(
        `Are you sure you want to delete this vocabulary item? This action is irreversible`,
      )
    ) {
      return;
    }
    await destroyEntityMutation.mutateAsync(dataTableColumn.id);
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["entities", "columns", "Grit::Assays::DataTableRow"],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "entities",
          "data",
          `grit/assays/data_tables/${data_table_id}/data_table_rows`,
        ],
      }),
    ]);
    navigate("..");
  };

  return (
    <>
      <h1>Edit column</h1>
      <Surface style={{ width: "100%" }}>
        <Form<Partial<DataTableColumnData>> form={form}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr",
              gridAutoRows: "max-content",
              gap: "calc(var(--spacing) * 2)",
              paddingBottom: "calc(var(--spacing) * 2)",
            }}
          >
            {form.state.errorMap.onSubmit && (
              <div
                style={{
                  gridColumnStart: 1,
                  gridColumnEnd: -1,
                  color: "var(--palette-error-main)",
                }}
              >
                {form.state.errorMap.onSubmit?.toString()}
              </div>
            )}
            {fields.map((f) => (
              <FormField form={form} fieldDef={f} key={f.name} />
            ))}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(max-content, 4)",
              }}
            >
              <h3 style={{ gridColumnStart: 1, gridColumnEnd: 5 }}>
                Split by:
              </h3>
              {pivotOptions.map((o) => (
                <FormField
                  form={form}
                  fieldDef={{
                    type: "boolean",
                    name: `pivot-${o.id}`,
                    display_name: o.assay_metadata_definition_id__name,
                  }}
                  key={o.id}
                />
              ))}
            </div>
          </div>
          <FormControls
            form={form}
            onDelete={onDelete}
            showDelete={!!dataTableColumn.id}
            showCancel
            onCancel={() => navigate("..")}
          />
        </Form>
      </Surface>
    </>
  );
};

export default DataTableColumnForm;
