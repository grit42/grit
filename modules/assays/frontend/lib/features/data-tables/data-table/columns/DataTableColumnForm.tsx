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

import {
  createSearchParams,
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  Button,
  Select,
  Surface,
} from "@grit42/client-library/components";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  ReactFormExtendedApi,
  useForm,
} from "@grit42/form";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit42/core";
import { DataTableColumnData } from "../../queries/data_table_columns";
import { useQueryClient } from "@grit42/api";
import { AssayModelMetadatumData } from "../../../../queries/assay_model_metadata";
import { Fragment, useMemo } from "react";

const PivotValuesField = ({
  form,
  pivot,
  pivotOptions,
}: {
  pivotOptions: { value: number; label: string }[];
  form: ReactFormExtendedApi<Partial<DataTableColumnData>, undefined>;
  pivot: any;
}) => {

  return (
    <form.Field
      name={`pivot-${pivot.id}-values`}
      children={(field) => (
        <Select
          label={pivot.assay_metadata_definition_id__name}
          options={pivotOptions.map((v: any) => ({
            id: v.value,
            value: v.value,
            label: v.label,
          }))}
          onChange={field.handleChange}
          value={field.state.value ?? []}
          multiple
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

  const createEntityMutation = useCreateEntityMutation<DataTableColumnData>(
    `grit/assays/data_tables/${dataTableColumn.data_table_id!}/data_table_columns`,
  );

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
        if (
          /^pivot-\d+-values$/.test(key) &&
          formValue[key] &&
          (formValue[key] as Array<unknown>).length > 0
        ) {
          pivots[key.split("-")[1]] = (formValue[key] as number[]) ?? [];
        }
      }

      const value = {
        ...dataTableColumn,
        ...getVisibleFieldData<Partial<DataTableColumnData>>(formValue, fields),
        pivots,
      };
      await (data_table_column_id === "new"
        ? createEntityMutation.mutateAsync(value as DataTableColumnData)
        : editEntityMutation.mutateAsync(value as DataTableColumnData));
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
        `Are you sure you want to delete this column? This action is irreversible`,
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
    <div>
      <h1>Edit column</h1>
      <Surface style={{ width: "100%" }}>
        <Form<Partial<DataTableColumnData>> form={form}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "calc(var(--spacing) * 2)",
              }}
            >
              {fields.map((f) => (
                <FormField form={form} fieldDef={f} key={f.name} />
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
              gridAutoRows: "max-content",
                gap: "calc(var(--spacing) * 2)",
              }}
            >
              <div>
                <h3>Metadata filters</h3>
                <p>
                  Aggregate results from experiments with the selected metadata.
                  <br />
                  No selection includes all experiments of the assay model.
                </p>
              </div>
              {pivotOptions.map((o) => (
                <Fragment key={o.id}>
                  <PivotValuesField
                    form={form}
                    pivot={o}
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
            showDelete={
              !!data_table_column_id && data_table_column_id !== "new"
            }
            showCancel
            onCancel={() => navigate("..")}
          >
            {!!data_table_column_id && data_table_column_id !== "new" && (
              <Link
                to={{
                  pathname: "../clone/new",
                  search: createSearchParams({
                    source_data_table_column_id: data_table_column_id,
                  }).toString(),
                }}
              >
                <Button color="secondary">Clone</Button>
              </Link>
            )}
          </FormControls>
        </Form>
      </Surface>
    </div>
  );
};

export default DataTableColumnForm;
