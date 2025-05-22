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
  InputLabel,
  Spinner,
  Surface,
} from "@grit42/client-library/components";
import { useForm, useStore } from "@tanstack/react-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FormField,
  genericErrorHandler,
  AddFormControl,
  FormFieldDef,
} from "@grit42/form";
import { useCreateLoadSetMutation } from "../../../mutations";
import { useLoadSetFields } from "../../../queries";
import { Editor } from "../../../../../components/Editor";
import { useMemo } from "react";
import { EntityProperties } from "../../../../entities";

interface NewLoadSetData {
  origin_id: number | null;
  name: string;
  entity: string;
  data: string;
  [key: string]: number | string | File[] | null;
}

const NewLoadSetForm = ({
  fields,
  defaultValues,
}: {
  fields: FormFieldDef[];
  defaultValues: EntityProperties;
}) => {
  const navigate = useNavigate();
  const createLoadSetMutation = useCreateLoadSetMutation();

  const form = useForm<NewLoadSetData>({
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
      for (const field of fields) {
        const stringValue = value[field.name]?.toString();
        if (stringValue) formData.append(field.name, stringValue);
      }
      const loadSet = await createLoadSetMutation.mutateAsync(formData);
      navigate(`../${loadSet.id}`, { relative: "path" });
    }),
    defaultValues: defaultValues as NewLoadSetData,
  });

  const errors = useStore(form.store, ({ errors }) =>
    Array.from(new Set(errors)).join("\n"),
  );

  const dataErrors = useStore(form.store, ({ fieldMeta }) =>
    Array.from(new Set(fieldMeta.data?.errors)).join("\n"),
  );

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
            {fields.map((f) => (
              <FormField key={f.name} form={form} fieldDef={f} />
            ))}

            <InputError error={dataErrors} />
            <InputError error={errors} />
          </div>
          <AddFormControl form={form} label="Start import" />
        </Surface>
        <div style={{ display: "grid", gridTemplateRows: "min-content 1fr"}}>
          <InputLabel label="Data *"/>
          <form.Field
            name="data"
            listeners={{
              onChange: ({ fieldApi }) => {
                fieldApi.form.validateField("data", "submit");
              },
            }}
            children={(field) => (
              <Editor onChange={field.handleChange} value={field.state.value} showFilePicker />
            )}
          />
        </div>
      </div>
    </form>
  );
};

const NewLoadSet = ({ entity }: { entity: string }) => {
  const [searchParams] = useSearchParams();
  const { data, isLoading, isError, error } = useLoadSetFields(entity);

  const defaultValues = useMemo(() => {
    const values: EntityProperties = {
      name: `${entity}-${Date.now()}`,
      data: "",
    };
    if (!data) return values;
    for (const field of data) {
      if (searchParams.has(field.name)) {
        switch (field.type) {
          case "integer":
            values[field.name] = Number(searchParams.get(field.name));
            break;
          default:
            values[field.name] = searchParams.get(field.name);
        }
      }
    }
    return values;
  }, [data, entity, searchParams]);

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorPage error={error} />;

  return <NewLoadSetForm defaultValues={defaultValues} fields={data} />;
};

export default NewLoadSet;
