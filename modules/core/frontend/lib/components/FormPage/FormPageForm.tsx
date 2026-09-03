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
  AnyFormApi,
  Form,
  FormBanner,
  FormControls,
  FormField,
  FormFieldDef,
  FormFields,
  genericErrorHandler,
  useForm,
} from "@grit42/form";
import { PropsWithChildren } from "react";

export type FormPageFormProps<T = unknown> = PropsWithChildren<{
  defaultValues: Partial<T>;
  onSubmit: (values: Partial<T>, formApi: AnyFormApi) => Promise<unknown>;
  fields: FormFieldDef[];
  columns?: number;
}>;

const FormPageForm = <T,>({
  defaultValues,
  children,
  onSubmit,
  fields,
  columns = 1,
}: FormPageFormProps<T>) => {
  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: genericErrorHandler(async ({ value, formApi }) => await onSubmit(value, formApi)),
  });

  return (
    <Form form={form}>
      <FormFields columns={columns}>
        <FormBanner content={form.state.errorMap.onSubmit} />
        {fields.map((f) => (
          <FormField fieldDef={f} key={f.name} />
        ))}
      </FormFields>
      <FormControls>{children}</FormControls>
    </Form>
  );
};

export default FormPageForm;
