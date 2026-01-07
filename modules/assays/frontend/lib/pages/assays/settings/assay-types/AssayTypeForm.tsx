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
import styles from "./assayTypes.module.scss";
import {
  AssayTypeData,
  useAssayType,
  useAssayTypeFields,
} from "../../../../queries/assay_types";
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

const AssayTypeForm = ({
  fields,
  assayType,
}: {
  fields: FormFieldDef[];
  assayType: Partial<AssayTypeData>;
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

  const destroyEntityMutation = useDestroyEntityMutation(
    "grit/assays/assay_types",
  );

  const form = useForm<Partial<AssayTypeData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AssayTypeData>>(
        formValue,
        fields,
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
        navigate(`../${newEntity.id}`, {
          relative: "path",
          replace: true,
        });
      } else {
        setFormData(
          await editEntityMutation.mutateAsync(value as AssayTypeData),
        );
        formApi.reset();
      }
    }),
  });

  const onDelete = async () => {
    if (
      !assayType.id ||
      !window.confirm(
        `Are you sure you want to delete this assay type? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(assayType.id);
    navigate("..");
  };

  return (
    <div className={styles.container}>
      <Surface className={styles.typeForm}>
        <h2
          style={{ alignSelf: "baseline", marginBottom: "1em" }}
        >{`${assayType.id ? "Edit" : "New"} assay type`}</h2>
        <Form<Partial<AssayTypeData>> form={form}>
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
            showDelete={!!assayType.id}
            showCancel
            cancelLabel={assayType.id ? "Back" : "Cancel"}
            onCancel={() => navigate("..")}
          />
        </Form>
      </Surface>
    </div>
  );
};

const AssayTypeFormWrapper = () => {
  const { assay_type_id } = useParams() as { assay_type_id: string };

  const {
    data: fields,
    isLoading: isAssayTypeFieldsLoading,
    isError: isAssayTypeFieldsError,
    error: assayTypeFieldsError,
  } = useAssayTypeFields();

  const { data, isLoading, isError, error } = useAssayType(assay_type_id);

  if (isAssayTypeFieldsLoading || isLoading) return <Spinner />;
  if (isAssayTypeFieldsError || isError || !fields || !data)
    return (
      <ErrorPage error={assayTypeFieldsError ?? error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  return <AssayTypeForm fields={fields} assayType={data} />;
};

export default AssayTypeFormWrapper;
