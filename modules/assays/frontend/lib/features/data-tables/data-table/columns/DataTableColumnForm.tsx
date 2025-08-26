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
import { CheckboxGroup, Surface } from "@grit42/client-library/components";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  ReactFormExtendedApi,
  useForm,
  useStore,
} from "@grit42/form";
import { useDestroyEntityMutation, useEditEntityMutation } from "@grit42/core";
import { DataTableColumnData } from "../../queries/data_table_columns";
import { useQueryClient } from "@grit42/api";
import { AssayModelMetadatumData } from "../../../../queries/assay_model_metadata";
import { Fragment, useEffect, useMemo } from "react";

const PivotValuesField = ({
  form,
  pivotId,
  pivotOptions,
}: {
  pivotOptions: { value: number; label: string }[];
  form: ReactFormExtendedApi<Partial<DataTableColumnData>, undefined>;
  pivotId: number;
}) => {
  const enabled = useStore(
    form.baseStore,
    (state) => (state.values as any)[`pivot-${pivotId}`] as boolean,
  );

  useEffect(() => {
    if (!enabled) {
      form.setFieldValue(`pivot-${pivotId}-values`, null);
    } else if (
      enabled &&
      form.getFieldValue(`pivot-${pivotId}-values`) === null
    ) {
      form.setFieldValue(
        `pivot-${pivotId}-values`,
        pivotOptions.map(({ value }) => value),
      );
    }
  }, [form, enabled, pivotId, pivotOptions]);

  return (
    <form.Field
      name={`pivot-${pivotId}-values`}
      children={(field) => (
        <CheckboxGroup
          disabled={!enabled}
          onChange={field.handleChange}
          value={(field.state.value as number[]) ?? []}
          options={pivotOptions.map((v: any) => ({
            id: v.value,
            value: v.value,
            label: v.label,
          }))}
        />
      )}
    />
  );
};

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
      ...Object.entries(dataTableColumn.pivots ?? {}).reduce(
        (acc, [key, value]) => ({
          ...acc,
          [`pivot-${key}`]: true,
          [`pivot-${key}-values`]: value,
        }),
        {},
      ),
    }),
    [dataTableColumn],
  );

  const form = useForm<Partial<DataTableColumnData>>({
    defaultValues: defaultValue,
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const pivots: Record<string, number[]> = {};
      for (const key in formValue) {
        if (/^pivot-\d+$/.test(key) && formValue[key]) {
          pivots[key.split("-")[1]] =
            (formValue[`${key}-values`] as number[]) ?? [];
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
                gridTemplateColumns: "1fr",
              }}
            >
              <h3>Split by:</h3>
              {pivotOptions.map((o) => (
                <Fragment key={o.id}>
                  <FormField
                    form={form}
                    fieldDef={{
                      type: "boolean",
                      name: `pivot-${o.id}`,
                      display_name: o.assay_metadata_definition_id__name,
                    }}
                  />
                  <PivotValuesField
                    form={form}
                    pivotId={o.id}
                    pivotOptions={
                      o.metadatum_values as {
                        value: number;
                        label: string;
                      }[]
                    }
                  />
                </Fragment>
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
