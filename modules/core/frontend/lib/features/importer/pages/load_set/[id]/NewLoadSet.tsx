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
  ErrorPage,
  InputError,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useForm, useStore } from "@tanstack/react-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FormField, genericErrorHandler, AddFormControl } from "@grit42/form";
import { useCreateLoadSetMutation } from "../../../mutations";
import { useLoadSetFields } from "../../../queries";
import { Editor } from "../../../../../components/Editor";

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
  const { data, isLoading, isError, error } = useLoadSetFields(entity);
  const createLoadSetMutation = useCreateLoadSetMutation();

  const form = useForm<NewLoadSetData & { data: string }>({
    validators: {
      onMount: () => "Provide either a file or text data",
      onChange: ({ value }) =>
        value.data.length > 0
          ? undefined
          : "Provide either a file or text data",
    },
    onSubmit: genericErrorHandler(async ({ value }) => {
      const formData = new FormData();
      formData.append(
        "data",
        new File([value.data], `${value.name}.csv`, {
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
      name: `${entity}-${Date.now()}`,
      entity,
      data: "",
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
    <form
      style={{ height: "100%" }}
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "480px 1fr",
          gap: "var(--spacing)",
          height: "100%",
        }}
      >
        <Surface style={{ width: "100%", maxWidth: 960 }}>
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

            <InputError error={dataErrors} />
            <InputError error={errors} />
          </div>
          <AddFormControl form={form} label="Start import" />
        </Surface>
        <form.Field
          name="data"
          listeners={{
            onChange: ({ fieldApi }) => {
              fieldApi.form.validateField("data", "submit");
            },
          }}
          children={(field) => (
            <Editor
              onChange={field.handleChange}
              value={field.state.value}
            />
          )}
        />
      </div>
    </form>
  );
};

export default NewLoadSet;
