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
import { CompoundTypeData } from "../../../../queries/compounds";

const CompoundTypeForm = ({
  fields,
  compoundType,
}: {
  fields: FormFieldDef[];
  compoundType: Partial<CompoundTypeData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] =
    useState<Partial<CompoundTypeData>>(compoundType);

  const createEntityMutation = useCreateEntityMutation<CompoundTypeData>(
    "grit/compounds/compound_types",
  );

  const editEntityMutation = useEditEntityMutation<CompoundTypeData>(
    "grit/compounds/compound_types",
    compoundType.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/compounds/compound_types",
  );

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<CompoundTypeData>>(
        formValue,
        fields,
      );
      if (!compoundType.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as CompoundTypeData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/compounds/compound_types",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
        navigate("../..");
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as CompoundTypeData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !compoundType.id ||
      !window.confirm(
        `Are you sure you want to delete this compound type? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(compoundType.id);
    navigate("..");
  };

  return (
    <CenteredSurface>
      <h2>{`${compoundType.id ? "Edit" : "New"} compound type`}</h2>
      <Form form={form}>
        <FormFields columns={1}>
          <FormBanner content={form.state.errorMap.onSubmit} />
          {fields.map((f) => (
            <FormField fieldDef={f} key={f.name} />
          ))}
        </FormFields>
        <FormControls
          onDelete={onDelete}
          showDelete={!!compoundType.id}
          showCancel
          cancelLabel={compoundType.id ? "Back" : "Cancel"}
          onCancel={() => navigate("..")}
        />
      </Form>
    </CenteredSurface>
  );
};

const CompoundTypeFormWrapper = () => {
  const { compound_type_id } = useParams() as { compound_type_id: string };

  const {
    data: fields,
    isLoading: isCompoundTypeFieldsLoading,
    isError: isCompoundTypeFieldsError,
    error: compoundTypeFieldsError,
  } = useEntityFields("Grit::Compounds::CompoundType");

  const { data, isLoading, isError, error } = useEntityDatum(
    "grit/compounds/compound_types",
    compound_type_id,
  );

  if (isCompoundTypeFieldsLoading || isLoading) return <Spinner />;
  if (isCompoundTypeFieldsError || isError || !fields || !data)
    return (
      <ErrorPage error={compoundTypeFieldsError ?? error}>
        <Link to="../..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  return <CompoundTypeForm fields={fields} compoundType={data} />;
};

export default CompoundTypeFormWrapper;
