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

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  Button,
  ErrorPage,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import styles from "./assays.module.scss";
import {
  AssayData,
  AssayFormFieldDef,
  useAssay,
  useAssayFields,
} from "../../../../../queries/assays";
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
  useStore,
} from "@grit42/form";
import { useAssayModelMetadata } from "../../../../../queries/assay_model_metadata";

const AssayForm = ({
  fields,
  assay,
}: {
  fields: AssayFormFieldDef[];
  assay: Partial<AssayData>;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AssayData>>(assay);

  const createEntityMutation =
    useCreateEntityMutation<AssayData>("grit/assays/assays");

  const editEntityMutation = useEditEntityMutation<AssayData>(
    "grit/assays/assays",
    assay.id ?? -1,
  );

  const destroyEntityMutation = useDestroyEntityMutation("grit/assays/assays");

  const form = useForm<Partial<AssayData>>({
    defaultValues: formData,
    onSubmit: genericErrorHandler(async ({ value: formValue, formApi }) => {
      const value = getVisibleFieldData<Partial<AssayData>>(
        formValue,
        fields
      );
      if (!assay.id) {
        const newEntity = await createEntityMutation.mutateAsync(
          value as AssayData,
        );
        queryClient.setQueryData(
          ["entities", "datum", "grit/assays/assays", newEntity.id.toString()],
          newEntity,
        );
        setFormData(newEntity);
        formApi.reset();
        navigate(`../${newEntity.id}`, {
          relative: "path",
          replace: true,
        });
      } else {
        setFormData(await editEntityMutation.mutateAsync(value as AssayData));
        formApi.reset();
      }
    }),
  });

  const assayModelId = useStore(
    form.baseStore,
    (state) => state.values.assay_model_id,
  );

  const {
    data: assayModelMetadata,
    isLoading: isAssayModelMetadataLoading,
    isError: isAssayModelMetadataError,
    error: assayModelMetadataError,
  } = useAssayModelMetadata(
    assayModelId ?? -1,
    undefined,
    undefined,
    undefined,
    {
      enabled: !!assayModelId,
    },
  );

  const assayModelMetadataDefinitions = useMemo(
    () =>
      assayModelMetadata?.map(
        ({ assay_metadata_definition_id }) => assay_metadata_definition_id,
      ),
    [assayModelMetadata],
  );

  const { baseFields, metadataFields } = useMemo(
    () =>
      fields.reduce(
        (acc, f) => {
          if (
            assayModelMetadataDefinitions?.find(
              (id) => f.metadata_definition_id === id,
            )
          ) {
            acc.metadataFields.push(f);
          } else if (f.metadata_definition_id === null) {
            if (f.name === "assay_model_id")
              acc.baseFields.push({ ...f, disabled: !!assay.id });
            else acc.baseFields.push(f);
          }
          return acc;
        },
        { baseFields: [], metadataFields: [] } as {
          baseFields: FormFieldDef[];
          metadataFields: FormFieldDef[];
        },
      ),
    [fields, assayModelMetadataDefinitions],
  );

  useEffect(() => {
    for (const field of fields) {
      if (
        field.metadata_definition_id !== null &&
        !assayModelMetadataDefinitions?.includes(field.metadata_definition_id)
      ) {
        form.deleteField(field.name);
      }
    }
  }, [metadataFields, form, fields, assayModelId]);

  const onDelete = async () => {
    if (
      !assay.id ||
      !window.confirm(
        `Are you sure you want to delete this assay? This action is irreversible`,
      )
    )
      return;
    await destroyEntityMutation.mutateAsync(assay.id);
    navigate("..");
  };

  return (
    <div className={styles.container}>
      <Surface className={styles.form}>
        <h2
          style={{ alignSelf: "baseline", marginBottom: "1em" }}
        >{`${assay.id ? "Edit" : "New"} assay`}</h2>
        <Form<Partial<AssayData>> form={form}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
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
            {baseFields.map((f) => (
              <FormField form={form} fieldDef={f} key={f.name} />
            ))}
            <h3
              style={{
                gridColumnStart: 1,
                gridColumnEnd: 3,
              }}
            >
              Metadata
            </h3>
            {!assayModelId && <p>Metadata fields will show when a model has been selected</p>}
            {isAssayModelMetadataLoading && <Spinner size={25}/>}
            {isAssayModelMetadataError && <ErrorPage error={assayModelMetadataError}/>}
            <div
              style={{
                gridColumnStart: 1,
                gridColumnEnd: 3,
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gridAutoRows: "max-content",
                gap: "calc(var(--spacing) * 2)",
              }}
            >
              {metadataFields.map((f) => (
                <FormField form={form} fieldDef={f} key={f.name} />
              ))}
            </div>
          </div>
          <FormControls
            form={form}
            onDelete={onDelete}
            showDelete={!!assay.id}
            showCancel
            cancelLabel={assay.id ? "Back" : "Cancel"}
            onCancel={() => navigate("..")}
          />
        </Form>
      </Surface>
    </div>
  );
};

const AssayFormWrapper = () => {
  const { assay_id } = useParams() as { assay_id: string };

  const {
    data: fields,
    isLoading: isAssayFieldsLoading,
    isError: isAssayFieldsError,
    error: assayFieldsError,
  } = useAssayFields();

  const { data, isLoading, isError, error } = useAssay(assay_id);

  if (isAssayFieldsLoading || isLoading) return <Spinner />;
  if (isAssayFieldsError || isError || !fields || !data)
    return (
      <ErrorPage error={assayFieldsError ?? error}>
        <Link to="..">
          <Button>Back</Button>
        </Link>
      </ErrorPage>
    );
  return <AssayForm fields={fields} assay={data} />;
};

export default AssayFormWrapper;
