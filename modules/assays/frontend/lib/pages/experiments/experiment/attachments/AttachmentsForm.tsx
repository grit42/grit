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

import {
  AddFormControl,
  Form,
  FormFieldDef,
  useForm,
  useFormInput,
  genericErrorHandler,
  FormFields,
  FormBanner,
} from "@grit42/form";
import { Button, Surface } from "@grit42/client-library/components";
import { useQueryClient } from "@grit42/api";
import { useAttachFilesToExperimentMutation } from "../../../../mutations/experiments";
import { ExperimentData } from "../../../../queries/experiments";
import { z } from "zod";
import styles from "./attachments.module.scss";

const AttachmentsForm = ({
  experiment,
  onClose,
}: {
  experiment: ExperimentData;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const attachMutation = useAttachFilesToExperimentMutation(experiment.id);

  const BinaryInput = useFormInput("binary");

  const form = useForm({
    defaultValues: { files: [] as File[] },
    validators: {
      onMount: z.object({ files: z.array(z.file()).min(1) }),
      onChange: z.object({ files: z.array(z.file()).min(1) }),
    },
    onSubmit: genericErrorHandler(async ({ value }) => {
      const formData = new FormData();
      (value.files as File[]).forEach((file) =>
        formData.append("files[]", file),
      );
      await attachMutation.mutateAsync(formData);
      await queryClient.invalidateQueries({
        queryKey: ["experiment_attachments", experiment.id],
      });
      onClose();
    }),
  });

  return (
    <div className={styles.attachmentsForm}>
      <Surface className={styles.surface}>
        <h3>Attach new files</h3>
        <Form form={form}>
          <FormFields columns={1}>
            <FormBanner content={form.state.errorMap.onSubmit} />
            <form.Field name="files">
              {(field) => (
                <BinaryInput
                  disabled={false}
                  error=""
                  field={
                    {
                      display_name: "Files",
                      name: "files",
                      type: "binary",
                      required: true,
                      multiple: true,
                      className: styles.fileInput,
                    } as FormFieldDef
                  }
                  handleBlur={field.handleBlur}
                  handleChange={field.handleChange}
                  value={field.state.value}
                />
              )}
            </form.Field>
          </FormFields>
          <AddFormControl label="Attach files">
            <Button onClick={onClose}>Cancel</Button>
          </AddFormControl>
        </Form>
      </Surface>
    </div>
  );
};

export default AttachmentsForm;
