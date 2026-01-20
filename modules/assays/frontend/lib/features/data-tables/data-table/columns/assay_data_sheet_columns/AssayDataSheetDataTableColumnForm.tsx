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
import { Button, Surface } from "@grit42/client-library/components";
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
import { toSafeIdentifier } from "@grit42/core/utils";
import styles from "../dataTableColumns.module.scss";
import { ExperimentMetadataFilters } from "../../../../experiments";
import ExperimentSelector from "./ExperimentSelector";

const ExperimentsFilter = ({
  assayModelId,
  form,
}: {
  assayModelId: string | number;
  form: ReactFormExtendedApi<Partial<DataTableColumnData>, undefined>;
}) => {
  const metadata_filters = useStore(
    form.baseStore,
    ({ values }) => values.metadata_filters,
  );
  return (
    <>
      <form.Field
        name="metadata_filters"
        children={(field) => (
          <div
            style={{
              height: "100%",
              width: "100%",
              marginTop: "var(--spacing)",
              display: "grid",
              gridTemplateColumns: "1fr",
              gridTemplateRows: "1fr",
            }}
          >
            <ExperimentMetadataFilters
              assayModelId={assayModelId}
              metadataFilters={field.state.value as Record<string, number[]>}
              setMetadataFilters={field.handleChange}
              identifier="metadata_definition_id"
            />
          </div>
        )}
      />
      <form.Field
        name="experiment_ids"
        children={(field) => (
          <ExperimentSelector
            assayModelId={assayModelId}
            selectedExperiments={field.state.value as number[]}
            setSelectedExperiments={field.handleChange}
            metadataFilters={metadata_filters ?? {}}
          />
        )}
      />
    </>
  );
};

const AssayDataSheetDataTableColumnForm = ({
  fields,
  dataTableColumn,
  dataTableId,
  dataTableColumnId,
}: {
  fields: FormFieldDef[];
  dataTableColumn: Partial<DataTableColumnData>;
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

  const form = useForm<Partial<DataTableColumnData>>({
    defaultValues: dataTableColumn,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = {
        ...dataTableColumn,
        ...getVisibleFieldData<Partial<DataTableColumnData>>(formValue, fields),
        experiment_ids: formValue.experiment_ids ?? [],
        metadata_filters: formValue.metadata_filters ?? {},
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
            "infiniteData",
            `grit/assays/data_tables/${dataTableId}/data_table_rows`,
          ],
        }),
      ]);
      formApi.reset(res);
      navigate(`../${res.id}`);
    }),
  });

  const { safe_name, proposed_safe_name } = useStore(
    form.baseStore,
    ({ values }) => {
      const { name, safe_name } = values;
      const proposed_safe_name = form.getFieldMeta("name")?.isDirty
        ? toSafeIdentifier(name as string)
        : safe_name;
      return { safe_name, proposed_safe_name };
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
    navigate("..");
  };

  return (
    <div className={styles.columnFormContainer}>
      <h1>{dataTableColumnId === "new" ? "Add" : "Edit"} column</h1>
      <Form<Partial<DataTableColumnData>>
        form={form}
        className={styles.dataSheetColumnForm}
      >
        <Surface className={styles.columnFormSurface}>
          <div className={styles.columnForm}>
            {form.state.errorMap.onSubmit && (
              <div className={styles.columnFormError}>
                {form.state.errorMap.onSubmit?.toString()}
              </div>
            )}
            <div className={styles.columnFormFields}>
              {fields.map((f) => (
                <div className={styles.columnFormField} key={f.name}>
                  <FormField form={form} fieldDef={f} />
                  {f.name === "safe_name" &&
                    safe_name !== proposed_safe_name &&
                    form.state.isDirty && (
                      <div className={styles.columnFormFieldSuggestion}>
                        <em
                          role="button"
                          onClick={() => {
                            form.setFieldValue("safe_name", proposed_safe_name);
                            form.setFieldMeta("safe_name", (prev) => ({
                              ...prev,
                              errorMap: {},
                            }));
                          }}
                        >
                          Use "{proposed_safe_name}"
                        </em>
                      </div>
                    )}
                </div>
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
        </Surface>
        <div className={styles.experimentFilters}>
          <div style={{ gridColumnStart: 1, gridColumnEnd: -1 }}>
            <h3>Experiments filter</h3>
            <p>
              Aggregate results from selected experiments.
              <br />
              No selection includes all experiments matching the metadata
              filters.
            </p>
          </div>
          <ExperimentsFilter
            assayModelId={dataTableColumn.assay_model_id!}
            form={form}
          />
        </div>
      </Form>
    </div>
  );
};

export default AssayDataSheetDataTableColumnForm;
