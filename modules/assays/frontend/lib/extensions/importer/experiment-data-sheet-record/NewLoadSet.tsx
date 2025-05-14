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
  ErrorPage,
  FileInput,
  Input,
  InputError,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FormField,
  Form,
  useForm,
  useStore,
  genericErrorHandler,
  AddFormControl,
} from "@grit42/form";
import { useCreateLoadSetMutation, useLoadSetFields } from "@grit42/core";

interface NewLoadSetData {
  origin_id: number | null;
  name: string;
  entity: string;
  [key: string]: number | string | File[] | null;
}

const NewLoadSet = ({ entity }: { entity: string }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const origin_id = searchParams.get("origin_id");
  const experiment_id = searchParams.get("experiment_id");
  const experiment_data_sheet_id = searchParams.get("experiment_data_sheet_id");
  const { data, isLoading, isError, error } = useLoadSetFields(entity);
  const createLoadSetMutation = useCreateLoadSetMutation();

  const form = useForm<NewLoadSetData & { data: File[]; text_data: string }>({
    validators: {
      onMount: () => "Provide either a file or text data",
      onChange: ({ value }) =>
        value.data[0] || value.text_data.length > 0
          ? undefined
          : "Provide either a file or text data",
    },
    onSubmit: genericErrorHandler(async ({ value }) => {
      const formData = new FormData();
      formData.append(
        "data",
        value.data[0]
          ? value.data[0]
          : new File([value.text_data], `${value.name}.csv`, {
              type: "application/csv",
            }),
      );
      for (const field of data ?? []) {
        const stringValue = value[field.name]?.toString();
        if (stringValue) formData.append(field.name, stringValue);
      }
      const loadSet = await createLoadSetMutation.mutateAsync(formData);
      navigate(`../${loadSet.id}`, { relative: "path" });
    }),
    defaultValues: {
      origin_id: origin_id ? parseInt(origin_id) : null,
      experiment_data_sheet_id: experiment_data_sheet_id
        ? parseInt(experiment_data_sheet_id)
        : null,
      experiment_id: experiment_id ? parseInt(experiment_id) : null,
      name: `${entity}-${Date.now()}`,
      entity,
      data: [],
      text_data: "",
    },
  });

  const errors = useStore(form.store, ({ errors }) =>
    Array.from(new Set(errors)).join("\n"),
  );

  const dataErrors = useStore(form.store, ({ fieldMeta }) =>
    Array.from(new Set(fieldMeta.data?.errors)).join("\n"),
  );

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorPage error={error} />;

  return (
    <Surface style={{ width: "100%", maxWidth: 960 }}>
      <Form form={form}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing)",
            paddingBottom: "var(--spacing)",
          }}
        >
          {data.map((d) => (
            <FormField key={d.name} form={form} fieldDef={d} />
          ))}
          <form.Field
            name="data"
            children={(field) => {
              return (
                <FileInput
                  label="Data"
                  accept={{
                    "text/*": [".sdf", ".sd", ".csv", ".tsv"],
                    "application/*": [".sdf", ".sd", ".csv", ".tsv"],
                  }}
                  onDrop={(files) => {
                    field.handleChange(files);
                    field.handleBlur();
                  }}
                  overrideFiles={field.state.value}
                />
              );
            }}
          />
          <form.Field
            name="text_data"
            listeners={{
              onChange: ({ fieldApi }) => {
                fieldApi.form.validateField("data", "submit");
              },
            }}
            children={(field) => {
              return (
                <Input
                  label="Text data "
                  name="text_data"
                  type="textarea"
                  style={{ height: 350 }}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    field.handleChange(e.target.value)
                  }
                  onBlur={field.handleBlur}
                  value={field.state.value as string | null}
                  error={Array.from(new Set(field.state.meta.errors)).join(
                    "\n",
                  )}
                />
              );
            }}
          />
          <InputError error={dataErrors} />
          <InputError error={errors} />
        </div>
        <AddFormControl form={form} label="Start import" />
      </Form>
    </Surface>
  );
};

export default NewLoadSet;
