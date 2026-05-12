/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/compounds.
 *
 * @grit42/compounds is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/compounds is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/compounds. If not, see <https://www.gnu.org/licenses/>.
 */

import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, ErrorPage, Spinner } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
  useEntityDatum,
  useEntityFields,
} from "@grit42/core";
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
import { CenteredSurface } from "@grit42/client-library/layouts";
import { BatchPropertyData } from "../../../../queries/batches";

const BatchPropertyForm = ({
  fields,
  batchProperty,
}: {
  fields: FormFieldDef[];
  batchProperty: Partial<BatchPropertyData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] =
    useState<Partial<BatchPropertyData>>(batchProperty);

  const createEntityMutation = useCreateEntityMutation<BatchPropertyData>(
    "grit/compounds/batch_properties",
  );

  const editEntityMutation = useEditEntityMutation<BatchPropertyData>(
    "grit/compounds/batch_properties",
    batchProperty.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/compounds/batch_properties",
  );

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<BatchPropertyData>>(
        formValue,
        fields,
      );
      if (!batchProperty.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as BatchPropertyData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/compounds/batch_properties",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
        navigate("../..");
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as BatchPropertyData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !batchProperty.id ||
      !window.confirm(
        `Are you sure you want to delete this batch property? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(batchProperty.id);
    navigate("..");
  };

  return (
    <CenteredSurface>
      <h2>{`${batchProperty.id ? "Edit" : "New"} batch property`}</h2>
      <Form form={form}>
        <FormFields>
          <FormBanner content={form.state.errorMap.onSubmit} />
          {fields.map((f) => (
            <FormField fieldDef={f} key={f.name} />
          ))}
        </FormFields>
        <FormControls
          onDelete={onDelete}
          showDelete={!!batchProperty.id}
          showCancel
          cancelLabel={batchProperty.id ? "Back" : "Cancel"}
          onCancel={() => navigate("..")}
        />
      </Form>
    </CenteredSurface>
  );
};

const BatchPropertyFormWrapper = () => {
  const { batch_property_id } = useParams() as { batch_property_id: string };

  const {
    data: fields,
    isLoading: isBatchPropertyFieldsLoading,
    isError: isBatchPropertyFieldsError,
    error: batchPropertyFieldsError,
  } = useEntityFields("Grit::Compounds::BatchProperty");

  const { data, isLoading, isError, error } = useEntityDatum(
    "grit/compounds/batch_properties",
    batch_property_id,
  );

  if (isBatchPropertyFieldsLoading || isLoading) return <Spinner />;
  if (isBatchPropertyFieldsError || isError || !fields || !data)
    return (
      <ErrorPage error={batchPropertyFieldsError ?? error}>
        <Link to="../..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  return <BatchPropertyForm fields={fields} batchProperty={data} />;
};

export default BatchPropertyFormWrapper;
