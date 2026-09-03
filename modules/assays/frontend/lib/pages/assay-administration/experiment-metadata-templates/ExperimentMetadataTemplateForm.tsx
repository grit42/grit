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
import { ExperimentMetadataTemplateData } from "../../../queries/experiment_metadata_templates";
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

const BASE_FIELDS: FormFieldDef[] = [
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

const ExperimentMetadataTemplateForm = ({
  metadataFields,
  metadataTemplate,
}: {
  metadataFields: FormFieldDef[];
  metadataTemplate: Partial<ExperimentMetadataTemplateData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] =
    useState<Partial<ExperimentMetadataTemplateData>>(metadataTemplate);

  const createEntityMutation =
    useCreateEntityMutation<ExperimentMetadataTemplateData>(
      "grit/assays/experiment_metadata_templates",
    );

  const editEntityMutation =
    useEditEntityMutation<ExperimentMetadataTemplateData>(
      "grit/assays/experiment_metadata_templates",
      metadataTemplate.id ?? -1,
    );

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<
        Partial<ExperimentMetadataTemplateData>
      >(formValue, [...BASE_FIELDS, ...metadataFields]);
      if (!metadataTemplate.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as ExperimentMetadataTemplateData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
          "grit/assays/experiment_metadata_templates",
            newEntity.id.toString(),
          ],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(
            value as ExperimentMetadataTemplateData,
          ),
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
        {BASE_FIELDS.map((f) => (
          <FormField fieldDef={f} key={f.name} />
        ))}
      </FormFields>
      <FormFields columns={3}>
        {metadataFields.map((f) => (
          <FormField fieldDef={f} key={f.name} />
        ))}
      </FormFields>
      <FormControls>
        {!metadataTemplate.id && (
          <Link to="..">
            <Button color="primary">Cancel</Button>
          </Link>
        )}
      </FormControls>
    </Form>
  );
};

export default ExperimentMetadataTemplateForm;
