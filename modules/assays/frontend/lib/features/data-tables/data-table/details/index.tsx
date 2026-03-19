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
import {
  DataTableData,
  useDataTable,
  useDataTableFields,
} from "../../queries/data_tables";
import {
  Form,
  FormBanner,
  FormControls,
  FormField,
  FormFieldDef,
  FormFields,
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
import { CenteredSurface } from "@grit42/client-library/layouts";
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

  const { data: dataTable } = useDataTable(dataTableId) as {
    data: DataTableData;
  };
  const { data: fields } = useDataTableFields(undefined, {
    select: (data) =>
      canEditDataTable
        ? data.map((f) => ({
            ...f,
            disabled: f.name === "entity_data_type_id" && !!dataTable.id,
          }))
        : data.map((f) => ({ ...f, disabled: true })),
  }) as { data: FormFieldDef[] };
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<DataTableData>>(
    dataTable ?? {},
  );

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

  const form = useForm({
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
    await queryClient.invalidateQueries({
      queryKey: ["entities", "data", "grit/assays/data_tables"],
    });
    navigate("../..");
  };

  return (
    <CenteredSurface>
      <Form form={form}>
        <FormFields columns={1}>
          <FormBanner content={form.state.errorMap.onSubmit} />
          {fields.map((f) => (
            <FormField fieldDef={f} key={f.name} />
          ))}
        </FormFields>
        <FormControls
          onDelete={onDelete}
          showDelete={!!dataTable.id && canEditDataTable}
          showCancel={!dataTable.id}
          onCancel={() => navigate("..")}
        />
      </Form>
    </CenteredSurface>
  );
};

export default DataTableDetails;
