/**
 * Copyright 2025 grit42 A/S. <https://grit42.com/>
 *
 * This file is part of @grit42/form.
 *
 * @grit42/form is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or  any later version.
 *
 * @grit42/form is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for
 * more details.
 *
 * You should have received a copy of the GNU General Public License along with
 * @grit42/form. If not, see <https://www.gnu.org/licenses/>.
 */

import { useMemo } from "react";
import { isFieldVisible } from "./utils";
import { requiredValidator } from "./validators";
import { FormFieldDef } from "./types";
import { DeepKeys, FieldValidators, ReactFormExtendedApi, useStore } from "@tanstack/react-form";
import { useFormInput } from "./FormInputProviderContext";

interface Props<T> {
  form: ReactFormExtendedApi<T>;
  fieldDef: FormFieldDef;
  validators?: FieldValidators<T, DeepKeys<T>>;
}

const FormField = <T,>({ form, fieldDef, validators }: Props<T>) => {
  const [referenceValue] = useStore(form.store, (state) =>
    fieldDef.reference ? [(state.values as any)[fieldDef.reference]] : [],
  );

  const visible = useMemo(
    () => isFieldVisible(fieldDef, referenceValue),
    [referenceValue, fieldDef],
  );

  const disabled = useMemo(() => {
    if (fieldDef.disabled === true) {
      return true;
    } else if (fieldDef.reference && fieldDef.disabled) {
      return (
        typeof fieldDef.disabled === "function" &&
        fieldDef.disabled(referenceValue as any)
      );
    }
    return false;
  }, [fieldDef, referenceValue]);

  const Input = useFormInput(fieldDef.type);

  if (!visible) return null;

  return (
    <form.Field
      name={fieldDef.name as any}
      validators={validators ?? {
        onChange: ({ value }) => requiredValidator(fieldDef, value),
      }}
      children={(field) => {
        return (
          <Input
            field={fieldDef}
            disabled={disabled}
            handleChange={field.handleChange}
            handleBlur={field.handleBlur}
            value={field.state.value ?? fieldDef.default}
            error={Array.from(new Set(field.state.meta.errors)).join("\n")}
          />
        );
      }}
    />
  );
};

export default FormField;
