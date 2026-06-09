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
import { CompoundPropertyData } from "../../../../queries/compounds";

const CompoundPropertyForm = ({
  fields,
  compoundProperty,
}: {
  fields: FormFieldDef[];
  compoundProperty: Partial<CompoundPropertyData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] =
    useState<Partial<CompoundPropertyData>>(compoundProperty);

  const createEntityMutation = useCreateEntityMutation<CompoundPropertyData>(
    "grit/compounds/compound_properties",
  );

  const editEntityMutation = useEditEntityMutation<CompoundPropertyData>(
    "grit/compounds/compound_properties",
    compoundProperty.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/compounds/compound_properties",
  );

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<CompoundPropertyData>>(
        formValue,
        fields,
      );
      if (!compoundProperty.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as CompoundPropertyData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/compounds/compound_properties",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
        navigate("../..");
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as CompoundPropertyData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !compoundProperty.id ||
      !window.confirm(
        `Are you sure you want to delete this compound property? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(compoundProperty.id);
    navigate("..");
  };

  return (
    <CenteredSurface>
      <h2>{`${compoundProperty.id ? "Edit" : "New"} compound property`}</h2>
      <Form form={form}>
        <FormFields>
          <FormBanner content={form.state.errorMap.onSubmit} />
          {fields.map((f) => (
            <FormField fieldDef={f} key={f.name} />
          ))}
        </FormFields>
        <FormControls
          onDelete={onDelete}
          showDelete={!!compoundProperty.id}
          showCancel
          cancelLabel={compoundProperty.id ? "Back" : "Cancel"}
          onCancel={() => navigate("..")}
        />
      </Form>
    </CenteredSurface>
  );
};

const CompoundPropertyFormWrapper = () => {
  const { compound_property_id } = useParams() as {
    compound_property_id: string;
  };

  const {
    data: fields,
    isLoading: isCompoundPropertyFieldsLoading,
    isError: isCompoundPropertyFieldsError,
    error: compoundPropertyFieldsError,
  } = useEntityFields("Grit::Compounds::CompoundProperty");

  const { data, isLoading, isError, error } = useEntityDatum(
    "grit/compounds/compound_properties",
    compound_property_id,
  );

  if (isCompoundPropertyFieldsLoading || isLoading) return <Spinner />;
  if (isCompoundPropertyFieldsError || isError || !fields || !data)
    return (
      <ErrorPage error={compoundPropertyFieldsError ?? error}>
        <Link to="../..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  return <CompoundPropertyForm fields={fields} compoundProperty={data} />;
};

export default CompoundPropertyFormWrapper;
