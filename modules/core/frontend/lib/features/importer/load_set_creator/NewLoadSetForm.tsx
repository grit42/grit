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

import {
  Button,
  ButtonGroup,
  Surface,
} from "@grit42/client-library/components";
import { useNavigate } from "react-router-dom";
import {
  useForm,
  useStore,
  FormField,
  genericErrorHandler,
  FormFieldDef,
  FieldListenerFn,
} from "@grit42/form";
import { useCreateLoadSetMutation } from "../mutations";
import { NewLoadSetData } from "../types";
import styles from "./loadSetCreator.module.scss";
import { newLoadSetPayload } from "../utils/payload";
import { useImporter } from "../ImportersContext";
import { EditorInput } from "../../../components";

export interface NewLoadSetFormProps {
  entity: string;
  loadSetFields: FormFieldDef[];
  loadSetBlockFields: FormFieldDef[];
  initialValues: Partial<NewLoadSetData>;
}

const NewLoadSetForm = ({
  entity,
  loadSetFields,
  loadSetBlockFields,
  initialValues,
}: NewLoadSetFormProps) => {
  const { guessDataSetValues } = useImporter(entity);
  const navigate = useNavigate();
  const createLoadSetMutation = useCreateLoadSetMutation();

  const form = useForm<Partial<NewLoadSetData>>({
    validators: {
      onMount: () => "Provide either a file or text data",
      onChange: ({ value }) =>
        value.load_set_blocks?.[0].data &&
        value.load_set_blocks[0].data.length > 0
          ? undefined
          : "Provide either a file or text data",
    },
    onSubmit: genericErrorHandler(async ({ value }) => {
      const loadSet = await createLoadSetMutation.mutateAsync(
        newLoadSetPayload(
          value as NewLoadSetData,
          loadSetFields,
          loadSetBlockFields,
        ),
      );
      navigate(`../${loadSet.id}`, { relative: "path" });
    }),
    defaultValues: initialValues,
  });

  const handleDataChange: FieldListenerFn<
    NewLoadSetData,
    "load_set_blocks[0].data"
  > = ({ fieldApi }) => {
    fieldApi.form.validateField("load_set_blocks[0].data", "submit");
  };

  const handleDataBlur: FieldListenerFn<
    NewLoadSetData,
    "load_set_blocks[0].data"
  > = async ({ value, fieldApi }) => {
    try {
      const formUpdates = await guessDataSetValues<NewLoadSetData>(value);
      Object.keys(formUpdates).forEach((key) => {
        fieldApi.form.setFieldValue(
          `load_set_blocks[0].${key}`,
          formUpdates[key],
        );
        fieldApi.form.setFieldMeta(`load_set_blocks[0].${key}`, (meta) => ({
          ...meta,
          errorMap: {
            ...meta.errorMap,
            onSubmit: undefined,
          },
        }));
      });
    } catch (e: any) {
      if (e && typeof e.errors === "object" && e.errors !== null) {
        Object.keys(e.errors).forEach((key) => {
          if (typeof e.errors[key] === "string") {
            fieldApi.form.setFieldMeta(`load_set_blocks[0].${key}`, (meta) => ({
              ...meta,
              errorMap: {
                ...meta.errorMap,
                onSubmit: e.errors[key],
              },
            }));
          }
        });
      }
    }
  };

  const errors = useStore(form.store, ({ errors }) =>
    Array.from(new Set(errors)).join("\n"),
  );

  const hasBlocks = useStore(
    form.baseStore,
    ({ values }) => !!values.load_set_blocks?.length,
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
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <ButtonGroup>
              <Button onClick={() => navigate(-1)}>Cancel</Button>
              <Button
                color="secondary"
                disabled={!canSubmit}
                type="submit"
                loading={isSubmitting}
              >
                Start import
              </Button>
            </ButtonGroup>
          )}
        />
      </div>

      <Surface className={styles.content}>
        <div className={styles.formFields}>
          {loadSetFields.map((f) => (
            <FormField key={f.name} form={form} fieldDef={f} />
          ))}
          {loadSetBlockFields.map((f) => (
            <FormField
              key={f.name}
              form={form}
              fieldDef={{ ...f, name: `load_set_blocks[0].${f.name}` }}
            />
          ))}
        </div>
      </Surface>
      <Surface className={styles.blockFormFields}>
        {errors && <p className={styles.error}>{errors}</p>}
        <form.Field
          name="load_set_blocks[0].data"
          listeners={{
            onChange: handleDataChange,
            onBlur: handleDataBlur,
          }}
          children={(field) => (
            <div
              style={{
                gridRowStart: 2,
                gridColumnStart: 1,
                gridColumnEnd: -1,
              }}
            >
              <EditorInput
                onChange={field.handleChange}
                onBlur={field.handleBlur}
                value={field.state.value as string}
                label="Data *"
                showFilePicker
                showInitialOverlay
              />
            </div>
          )}
        />
      </Surface>
      {!hasBlocks && (
        <div className={styles.noFiles}>
          <Button color="secondary">Select a file</Button>
        </div>
      )}
    </form>
  );
};

export default NewLoadSetForm;
