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
import { Link, useNavigate } from "react-router-dom";
import { AssayTypeData } from "../../../queries/assay_types";
import { useQueryClient } from "@grit42/api";
import { useCreateEntityMutation, useEditEntityMutation } from "@grit42/core";
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
import { Button } from "@grit42/client-library/components";

const FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
  {
    name: "description",
    display_name: "Description",
    type: "text",
    required: false,
  },
];

const AssayTypeForm = ({
  assayType = {},
}: {
  assayType?: Partial<AssayTypeData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AssayTypeData>>(assayType);

  const createEntityMutation = useCreateEntityMutation<AssayTypeData>(
    "grit/assays/assay_types",
  );

  const editEntityMutation = useEditEntityMutation<AssayTypeData>(
    "grit/assays/assay_types",
    assayType.id ?? -1,
  );

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AssayTypeData>>(
        formValue,
        FIELDS,
      );
      if (!assayType.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as AssayTypeData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/assay_types",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as AssayTypeData),
        );
        formApi.reset();
      }
      navigate("..");
    }),
  });

  return (
    <Form form={form}>
      <FormFields columns={1}>
        <FormBanner content={form.state.errorMap.onSubmit} />
        {FIELDS.map((f) => (
          <FormField fieldDef={f} key={f.name} />
        ))}
      </FormFields>
      <FormControls>
        {!assayType.id && (
          <Link to="..">
            <Button color="primary">Cancel</Button>
          </Link>
        )}
      </FormControls>
    </Form>
  );
};

export default AssayTypeForm;
