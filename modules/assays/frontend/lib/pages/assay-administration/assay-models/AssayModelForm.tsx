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
import { useQueryClient } from "@grit42/api";
import {
  EntityFormFieldDef,
  useCreateEntityMutation,
  useEditEntityMutation,
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
import { Button } from "@grit42/client-library/components";
import { AssayModelData } from "../../../queries/assay_models";

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
  {
    name: "assay_type_id",
    display_name: "Assay type",
    type: "entity",
    entity: {
      full_name: "Grit::Assays::AssayType",
      name: "AssayType",
      path: "grit/assays/assay_types",
      primary_key: "id",
      primary_key_type: "integer",
      column: "assay_type_id",
      display_column: "name",
      display_column_type: "string",
    },
  } as EntityFormFieldDef,
];

const AssayModelForm = ({
  assayModel,
  cancelPath = ".."
}: {
  assayModel: Partial<AssayModelData>;
  cancelPath?: string;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<
    Partial<AssayModelData>
  >(assayModel);

  const createEntityMutation =
    useCreateEntityMutation<AssayModelData>(
      "grit/assays/assay_models",
    );

  const editEntityMutation = useEditEntityMutation<AssayModelData>(
    "grit/assays/assay_models",
    assayModel.id ?? -1,
  );

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AssayModelData>>(
        formValue,
        FIELDS,
      );
      if (!assayModel.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as AssayModelData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/assay_models",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
        navigate(`..`);
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(
            value as AssayModelData,
          ),
        );
        formApi.reset();
      }
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
        {!assayModel.id && (
          <Link to={cancelPath} relative="path">
            <Button color="primary">Cancel</Button>
          </Link>
        )}
      </FormControls>
    </Form>
  );
};

export default AssayModelForm;
