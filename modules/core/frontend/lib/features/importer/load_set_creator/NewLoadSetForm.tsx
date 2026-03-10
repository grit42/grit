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
  Form,
} from "@grit42/form";
import { useCreateLoadSetMutation } from "../mutations";
import { NewLoadSetData } from "../types";
import styles from "./loadSetCreator.module.scss";
import { newLoadSetPayload, createDataBlurHandler } from "../utils";
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

  const form = useForm({
    validators: {
      onMount: () => "Provide either a file or text data",
      onChange: ({ value }: { value: Partial<NewLoadSetData> }) =>
        (value as NewLoadSetData).load_set_blocks?.[0].data &&
        (value as NewLoadSetData).load_set_blocks[0].data.length > 0
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
  const handleDataChange = async ({ fieldApi }: any) => {
    fieldApi.form.validateField("load_set_blocks[0].data", "submit");
  };

  const handleDataBlur = createDataBlurHandler(
    guessDataSetValues,
    "load_set_blocks[0].",
  );

  const errors = useStore(form.store, ({ errors }) =>
    Array.from(new Set(errors as string[])).join("\n"),
  ) as string;

  return (
    <Form className={styles.form} form={form}>
      <div className={styles.header}>
        <h1>Upload data</h1>
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <ButtonGroup>
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
            <FormField key={f.name} fieldDef={f} />
          ))}
          {loadSetBlockFields.map((f) => (
            <FormField
              key={f.name}
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
            <div className={styles.dataField}>
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
    </Form>
  );
};

export default NewLoadSetForm;
