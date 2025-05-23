/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/core.
 *
 * @grit42/core is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/core is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/core. If not, see <https://www.gnu.org/licenses/>.
 */

import { InputError, Surface } from "@grit42/client-library/components";
import { useForm, useStore } from "@grit42/form";
import { useNavigate } from "react-router-dom";
import {
  FormField,
  genericErrorHandler,
  AddFormControl,
  FormFieldDef,
  FieldListenerFn,
} from "@grit42/form";
import { useCreateLoadSetMutation } from "../../../../../mutations";
import { guessDelimiter } from "../../../../../utils/csv";
import { NewLoadSetData } from "../../../../../types";
import EditorInput from "../../components/EditorInput";
import styles from "./NewLoadSetForm.module.scss";
import { newLoadSetPayload } from "../../../../../utils/payload";
import { useMemo } from "react";

export interface NewLoadSetFormProps {
  fields: FormFieldDef[];
  initialValues: NewLoadSetData;
}

const NewLoadSetForm = ({
  fields,
  initialValues: initialValues,
}: NewLoadSetFormProps) => {
  const navigate = useNavigate();
  const createLoadSetMutation = useCreateLoadSetMutation();

  const separatorField = useMemo(
    () => fields.find((f) => f.name === "separator"),
    [fields],
  );

  const form = useForm<NewLoadSetData>({
    validators: {
      onMount: () => "Provide either a file or text data",
      onChange: ({ value }) =>
        value.data.length > 0
          ? undefined
          : "Provide either a file or text data",
    },
    onSubmit: genericErrorHandler(async ({ value }) => {
      const loadSet = await createLoadSetMutation.mutateAsync(
        newLoadSetPayload(fields, value),
      );
      navigate(`../${loadSet.id}`, { relative: "path" });
    }),
    defaultValues: initialValues,
  });

  const handleDataChange: FieldListenerFn<NewLoadSetData, "data"> = ({
    fieldApi,
  }) => {
    fieldApi.form.validateField("data", "submit");
  };

  const handleDataBlur: FieldListenerFn<NewLoadSetData, "data"> = ({
    value,
    fieldApi,
  }) => {
    if (!value.length || !separatorField) return;
    guessDelimiter(value).then((guess) => {
      if (guess) {
        fieldApi.form.setFieldValue("separator", guess);
        fieldApi.form.setFieldMeta("separator", (meta) => ({
          ...meta,
          errorMap: {
            ...meta.errorMap,
            onSubmit: undefined,
          },
        }));
      } else if (separatorField?.required) {
        fieldApi.form.setFieldMeta("separator", (meta) => ({
          ...meta,
          errorMap: {
            ...meta.errorMap,
            onSubmit: "Could not be guessed, please select manually",
          },
        }));
      }
    });
  };

  const errors = useStore(form.store, ({ errors }) =>
    Array.from(new Set(errors)).join("\n"),
  );

  const dataErrors = useStore(form.store, ({ fieldMeta }) =>
    Array.from(new Set(fieldMeta.data?.errors)).join("\n"),
  );

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div className={styles.header}>
        <h1>Upload data</h1>
        <AddFormControl form={form} label="Start import" />
      </div>

      <Surface className={styles.content}>
        <div className={styles.formFields}>
          {errors && <p className={styles.error}>{errors}</p>}
          {fields.map((f) => (
            <FormField key={f.name} form={form} fieldDef={f} />
          ))}
          <InputError error={dataErrors} />
        </div>

        <form.Field
          name="data"
          listeners={{
            onChange: handleDataChange,
            onBlur: handleDataBlur,
          }}
          children={(field) => (
            <EditorInput
              onChange={field.handleChange}
              onBlur={field.handleBlur}
              value={field.state.value}
              label="Data *"
              showFilePicker
              showInitialOverlay
            />
          )}
        />
      </Surface>
    </form>
  );
};

export default NewLoadSetForm;
