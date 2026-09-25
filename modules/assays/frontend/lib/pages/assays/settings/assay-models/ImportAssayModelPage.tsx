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

import { Link, useNavigate } from "react-router-dom";
import { Button } from "@grit42/client-library/components";
import { CenteredSurface } from "@grit42/client-library/layouts";
import {
  AddFormControl,
  Form,
  FormBanner,
  FormFieldDef,
  FormFields,
  genericErrorHandler,
  useForm,
  useFormInput,
} from "@grit42/form";
import { z } from "zod";
import { useImportAssayModelsMutation } from "../../../../mutations/assay_models";

const ImportAssayModelPage = () => {
  const navigate = useNavigate();
  const importMutation = useImportAssayModelsMutation();

  const BinaryInput = useFormInput("binary");

  const form = useForm({
    defaultValues: { files: [] as File[] },
    validators: {
      onMount: z.object({ files: z.array(z.file()).min(1).max(1) }),
      onChange: z.object({ files: z.array(z.file()).min(1).max(1) }),
    },
    onSubmit: genericErrorHandler(async ({ value }) => {
      const formData = new FormData();
      formData.append("file", (value.files as File[])[0]);
      await importMutation.mutateAsync(formData);
      navigate("..", { relative: "path" });
    }),
  });

  return (
    <CenteredSurface>
      <h2>Import assay model</h2>
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
                      display_name: "File",
                      name: "files",
                      type: "binary",
                      required: true,
                      multiple: false,
                      description:
                        "A JSON file previously exported from an Assay Model. May contain more than one assay model.",
                    } as FormFieldDef
                  }
                  handleBlur={field.handleBlur}
                  handleChange={field.handleChange}
                  value={field.state.value}
                />
              )}
            </form.Field>
          </FormFields>
          <AddFormControl label="Import">
            <Link to="..">
              <Button>Cancel</Button>
            </Link>
          </AddFormControl>
      </Form>
    </CenteredSurface>
  );
};

export default ImportAssayModelPage;
