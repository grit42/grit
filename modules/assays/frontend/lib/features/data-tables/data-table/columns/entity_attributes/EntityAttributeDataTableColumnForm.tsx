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

import { Link, useNavigate } from "react-router-dom";
import { Button, Surface } from "@grit42/client-library/components";
import {
  AddFormControl,
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
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
import styles from "../dataTableColumns.module.scss";
import { classnames } from "@grit42/client-library/utils";
import { toSafeIdentifier } from "@grit42/core/utils";

const EntityAttributeDataTableColumnForm = ({
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
    onSubmit: genericErrorHandler(async ({ value: formValue }) => {
      const value = {
        ...dataTableColumn,
        ...getVisibleFieldData<Partial<DataTableColumnData>>(formValue, fields),
      };
      await (dataTableColumnId === "new"
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
      navigate("..");
    }),
  });

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

  return (
    <div
      className={classnames(
        styles.columnFormContainer,
        styles.entityAttributeColumnFormContainer,
      )}
    >
      <h1>Edit column</h1>
      <Surface className={styles.columnFormSurface}>
        <Form<Partial<DataTableColumnData>> form={form}>
          <div
            className={classnames(
              styles.columnForm,
              styles.entityAttributeColumnForm,
            )}
          >
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
            />
          )}
        </Form>
      </Surface>
    </div>
  );
};

export default EntityAttributeDataTableColumnForm;
