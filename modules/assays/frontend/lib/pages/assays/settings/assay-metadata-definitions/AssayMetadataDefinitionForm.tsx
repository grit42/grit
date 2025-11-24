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
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, ErrorPage, Spinner, Surface } from "@grit42/client-library/components";
import styles from "./assayMetadataDefinitions.module.scss";
import {
  AssayMetadataDefinitionData,
  useAssayMetadataDefinition,
  useAssayMetadataDefinitionFields,
} from "../../../../queries/assay_metadata_definitions";
import { useQueryClient } from "@grit42/api";
import {
  useCreateEntityMutation,
  useDestroyEntityMutation,
  useEditEntityMutation,
} from "@grit42/core";
import {
  Form,
  FormControls,
  FormField,
  FormFieldDef,
  genericErrorHandler,
  getVisibleFieldData,
  useForm,
} from "@grit42/form";

const AssayMetadataDefinitionForm = ({
  fields,
  assayMetadataDefinition,
}: {
  fields: FormFieldDef[];
  assayMetadataDefinition: Partial<AssayMetadataDefinitionData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AssayMetadataDefinitionData>>(assayMetadataDefinition);

  const createEntityMutation = useCreateEntityMutation<AssayMetadataDefinitionData>(
    "grit/assays/assay_metadata_definitions",
  );

  const editEntityMutation = useEditEntityMutation<AssayMetadataDefinitionData>(
    "grit/assays/assay_metadata_definitions",
    assayMetadataDefinition.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_metadata_definitions",
  );

  const form = useForm<Partial<AssayMetadataDefinitionData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AssayMetadataDefinitionData>>(
        formValue,
        fields,
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
        navigate(`../${newEntity.id}`, {
          relative: "path",
          replace: true,
        });
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as AssayMetadataDefinitionData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !assayMetadataDefinition.id ||
      !window.confirm(
        `Are you sure you want to delete this assay metadata? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(assayMetadataDefinition.id);
    navigate("..");
  };

  return (
    <div className={styles.container}>
      <Surface className={styles.form}>
        <h2
          style={{ alignSelf: "baseline", marginBottom: "1em" }}
        >{`${assayMetadataDefinition.id ? "Edit" : "New"} assay metadata`}</h2>
        <Form<Partial<AssayMetadataDefinitionData>> form={form}>
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
            showDelete={!!assayMetadataDefinition.id}
            showCancel
            cancelLabel={assayMetadataDefinition.id ? "Back" : "Cancel"}
            onCancel={() => navigate("..")}
          />
        </Form>
      </Surface>
    </div>
  );
};

const AssayMetadataDefinitionFormWrapper = () => {
  const { assay_metadata_definition_id } = useParams() as { assay_metadata_definition_id: string };

  const {
    data: fields,
    isLoading: isAssayMetadataDefinitionFieldsLoading,
    isError: isAssayMetadataDefinitionFieldsError,
    error: assayMetadataDefinitionFieldsError,
  } = useAssayMetadataDefinitionFields();

  const { data, isLoading, isError, error } = useAssayMetadataDefinition(assay_metadata_definition_id);

  if (isAssayMetadataDefinitionFieldsLoading || isLoading) return <Spinner />;
  if (isAssayMetadataDefinitionFieldsError || isError || !fields || !data)
    return (
      <ErrorPage error={assayMetadataDefinitionFieldsError ?? error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  return <AssayMetadataDefinitionForm fields={fields} assayMetadataDefinition={data} />;
};

export default AssayMetadataDefinitionFormWrapper;
