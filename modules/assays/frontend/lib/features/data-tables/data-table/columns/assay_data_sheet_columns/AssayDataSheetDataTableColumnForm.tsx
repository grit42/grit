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

import { createSearchParams, Link, useNavigate } from "react-router-dom";
import { Button, Select, Surface } from "@grit42/client-library/components";
import {
  AddFormControl,
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
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit42/core";
import { DataTableColumnData } from "../../../queries/data_table_columns";
import { useQueryClient } from "@grit42/api";
import { AssayModelMetadatumData } from "../../../../../queries/assay_model_metadata";
import { Fragment, useMemo } from "react";
import { toSafeIdentifier } from "@grit42/core/utils";

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

function deriveProposedName(
  values: Partial<DataTableColumnData>,
  pivotOptions: AssayModelMetadatumData[],
) {
  const { aggregation_method, assay_data_sheet_column_id__name } = values;
  const pivotValuesNames = Object.keys(values)
    .filter((key) => /^pivot-\d+-values$/.test(key))
    .map((key) => {
      const pivotId = key.split("-")[1];
      const pivot = pivotOptions.find(({ id }) => id.toString() === pivotId);
      return (values[key] as number[])
        ?.map(
          (v) =>
            (pivot?.metadatum_values as any[])?.find(
              ({ value }: { value: number }) => value === v,
            )?.label,
        )
        .join(" ");
    })
    .join(" ")
    .trim();
  return [
    assay_data_sheet_column_id__name,
    pivotValuesNames,
    aggregation_method,
  ]
    .filter((v) => !!v && v !== "")
    .join(" ");
}

const AssayDataSheetDataTableColumnForm = ({
  fields,
  dataTableColumn,
  pivotOptions,
  dataTableId,
  dataTableColumnId,
}: {
  fields: FormFieldDef[];
  dataTableColumn: Partial<DataTableColumnData>;
  pivotOptions: AssayModelMetadatumData[];
  dataTableId: string | number;
  dataTableColumnId: string | number;
}) => {
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const createEntityMutation = useCreateEntityMutation<DataTableColumnData>(
    `grit/assays/data_tables/${dataTableId}/data_table_columns`,
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
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
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
      const res = await (dataTableColumnId === "new"
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
            `grit/assays/data_tables/${dataTableId}/data_table_columns`,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "entities",
            "data",
            `grit/assays/data_tables/${dataTableId}/data_table_rows`,
          ],
        }),
      ]);
      formApi.reset(res);
      navigate(`../${res.id}`);
    }),
  });

  const { safe_name, proposed_safe_name, name, proposed_name } = useStore(
    form.baseStore,
    ({ values }) => {
      const isPivotTouched = Object.entries(form.fieldMetaDerived.state)
        .filter(([key]) => /^pivot-\d+-values$/.test(key))
        .some(([, { isDirty }]) => isDirty);
      const {
        name,
        safe_name,
      } = values;
      const proposed_name =
        isPivotTouched || form.getFieldMeta("aggregation_method")?.isDirty
          ? deriveProposedName(values, pivotOptions) : name;
      const proposed_safe_name = form.getFieldMeta("name")?.isDirty
        ? toSafeIdentifier(name as string)
        : safe_name;
      return { name, safe_name, proposed_safe_name, proposed_name };
    },
  );

  const onDelete = async () => {
    if (
      !dataTableColumn.id ||
      !window.confirm(
        `Are you sure you want to remove this column? This action is irreversible`,
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
          `grit/assays/data_tables/${dataTableId}/data_table_rows`,
        ],
      }),
    ]);
    navigate("..");
  };

  return (
    <div
      style={{
        marginInline: "auto",
        height: "100%",
        display: "grid",
        gridTemplateRows: "min-content 1fr",
        overflow: "auto",
      }}
    >
      <h1>{dataTableColumnId === "new" ? "Add" : "Edit"} column</h1>
      <Surface style={{ width: "100%", height: "100%" }}>
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
                <Fragment key={f.name}>
                  <FormField form={form} fieldDef={f} />
                  {f.name === "safe_name" &&
                    safe_name !== proposed_safe_name &&
                    form.state.isDirty && (
                      <em
                        role="button"
                        style={{
                          cursor: "pointer",
                          width: "max-content",
                          color: "var(--palette-background-contrast-text)",
                          opacity: 0.75,
                        }}
                        onClick={() =>
                          form.setFieldValue("safe_name", proposed_safe_name)
                        }
                      >
                        Use "{proposed_safe_name}"
                      </em>
                    )}
                  {f.name === "name" &&
                    name !== proposed_name &&
                    form.state.isDirty && (
                      <em
                        role="button"
                        style={{
                          cursor: "pointer",
                          width: "max-content",
                          color: "var(--palette-background-contrast-text)",
                          opacity: 0.75,
                        }}
                        onClick={() =>
                          form.setFieldValue("name", proposed_name)
                        }
                      >
                        Use "{proposed_name}"
                      </em>
                    )}
                </Fragment>
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
          {dataTableColumnId === "new" && (
            <AddFormControl form={form} label="Save">
              <Link to="..">
                <Button>Cancel</Button>
              </Link>
            </AddFormControl>
          )}
          {dataTableColumnId !== "new" && (
            <FormControls
              form={form}
              onDelete={onDelete}
              showDelete={dataTableColumnId !== "new"}
              showCancel
              cancelLabel={dataTableColumnId === "new" ? "Cancel" : "Back"}
              onCancel={() => navigate("..")}
            >
              {dataTableColumnId !== "new" && (
                <Link
                  to={{
                    pathname: "../clone",
                    search: createSearchParams({
                      data_table_column_id: dataTableColumnId.toString(),
                    }).toString(),
                  }}
                >
                  <Button color="secondary">Clone</Button>
                </Link>
              )}
            </FormControls>
          )}
        </Form>
      </Surface>
    </div>
  );
};

export default AssayDataSheetDataTableColumnForm;
