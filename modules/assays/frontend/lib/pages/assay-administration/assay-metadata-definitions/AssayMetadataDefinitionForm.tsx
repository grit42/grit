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
import styles from "./assayMetadataDefinitions.module.scss";
import { AssayMetadataDefinitionData } from "../../../queries/assay_metadata_definitions";
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
  useStore,
} from "@grit42/form";
import { toSafeIdentifier } from "@grit42/core/utils";
import { Button } from "@grit42/client-library/components";

const FIELDS: FormFieldDef[] = [
  {
    name: "name",
    display_name: "Name",
    type: "string",
    required: true,
  },
  {
    name: "safe_name",
    display_name: "Safe name",
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
    name: "vocabulary_id",
    display_name: "Vocabulary",
    type: "entity",
    required: true,
    entity: {
      full_name: "Grit::Core::Vocabulary",
      name: "Vocabulary",
      path: "grit/core/vocabularies",
      primary_key: "id",
      primary_key_type: "integer",
      column: "vocabulary_id",
      display_column: "name",
      display_column_type: "string",
    },
  } as EntityFormFieldDef,
];

const AssayMetadataDefinitionForm = ({
  assayMetadataDefinition,
}: {
  assayMetadataDefinition: Partial<AssayMetadataDefinitionData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<
    Partial<AssayMetadataDefinitionData>
  >(assayMetadataDefinition);

  const createEntityMutation =
    useCreateEntityMutation<AssayMetadataDefinitionData>(
      "grit/assays/assay_metadata_definitions",
    );

  const editEntityMutation = useEditEntityMutation<AssayMetadataDefinitionData>(
    "grit/assays/assay_metadata_definitions",
    assayMetadataDefinition.id ?? -1,
  );

  const form = useForm({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AssayMetadataDefinitionData>>(
        formValue,
        FIELDS,
      );
      if (!assayMetadataDefinition.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as AssayMetadataDefinitionData,
        );
        queryClient.setQueryData(
          [
            "entities",
            "datum",
            "grit/assays/assay_metadata_definitions",
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
            value as AssayMetadataDefinitionData,
          ),
        );
        formApi.reset();
      }
    }),
  });

  const { safe_name, proposed_safe_name } = useStore(
    form.store,
    ({ values }) => {
      const { name, safe_name } = values;
      const proposed_safe_name = form.getFieldMeta("name")?.isDirty
        ? toSafeIdentifier(name as string)
        : safe_name;
      return { safe_name, proposed_safe_name };
    },
  );

  return (
    <Form form={form}>
      <FormFields columns={1}>
        <FormBanner content={form.state.errorMap.onSubmit} />
        {FIELDS.map((f) => (
          <div className={styles.formField} key={f.name}>
            <FormField fieldDef={f} />
            {f.name === "safe_name" &&
              safe_name !== proposed_safe_name &&
              form.state.isDirty && (
                <div className={styles.formFieldSuggestion}>
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
      </FormFields>
      <FormControls>
        {!assayMetadataDefinition.id && (
          <Link to="..">
            <Button color="primary">Cancel</Button>
          </Link>
        )}
      </FormControls>
    </Form>
  );
};

export default AssayMetadataDefinitionForm;
