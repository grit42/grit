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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Surface } from "@grit42/client-library/components";
import { DataTableData, useDataTable, useDataTableFields } from "../../queries/data_tables";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
  useHasRoles,
} from "@grit42/core";
import { useQueryClient } from "@grit42/api";
import styles from "../dataTable.module.scss"
interface Props {
  dataTableId: string | number;
}

const DataTableDetails = ({ dataTableId }: Props) => {
  const navigate = useNavigate();
  const canEditDataTable = useHasRoles([
    "Administrator",
    "AssayAdministrator",
    "AssayUser",
  ]);

  const { data: dataTable } = useDataTable(dataTableId) as { data: DataTableData };
  const { data: fields } = useDataTableFields(undefined, {
    select: (data) =>
      canEditDataTable ? data.map((f) => ({ ...f, disabled: f.name === "entity_data_type_id" && !!dataTable.id })) : data.map((f) => ({ ...f, disabled: true })),
  }) as { data: FormFieldDef[] };
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<DataTableData>>(dataTable ?? {});

  const createEntityMutation = useCreateEntityMutation<DataTableData>(
    "grit/assays/data_tables",
  );

  const editEntityMutation = useEditEntityMutation<DataTableData>(
    "grit/assays/data_tables",
    dataTable.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/data_tables",
  );

  const form = useForm<Partial<DataTableData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<DataTableData>>(
        formValue,
        fields,
      );
      if (!dataTable.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as DataTableData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/data_tables",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
        navigate(`../${newEntity.id}`, {
          relative: "path",
          replace: true,
        });
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as DataTableData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !dataTable.id ||
      !window.confirm(
        `Are you sure you want to delete this data table? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(dataTable.id);
    navigate("..");
  };

  return (
    <Surface className={styles.dataTable} style={{ width: "100%", height: "100%" }}>
      <Form<Partial<DataTableData>> form={form}>
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
        </div>
        <FormControls
          form={form}
          onDelete={onDelete}
          showDelete={!!dataTable.id && canEditDataTable}
          showCancel
          cancelLabel="Back"
          onCancel={() => navigate(dataTable.id ? "../.." : "..")}
        />
      </Form>
    </Surface>
  );
};

export default DataTableDetails;
