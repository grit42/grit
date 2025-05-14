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

import { FormFieldDef, NullablePartial } from "./types";

export function isFieldVisible(field: FormFieldDef, referenceValue: unknown) {
  if (field.hidden) {
    if (typeof field.hidden === "function") {
      return !field.hidden(referenceValue);
    }
    return !field.hidden;
  }
  return true;
}

export function getVisibleFieldData<T>(
  formValues: T,
  fields: FormFieldDef[],
): NullablePartial<T> {
  const data: NullablePartial<T> = {};
  for (const field of fields) {
    const name = field.name as keyof T;
    if (
      isFieldVisible(
        field,
        field.reference ? formValues[field.reference as keyof T] : undefined,
      )
    ) {
      data[name] = formValues[name];
      if (field.type === "boolean") {
        data[name] = formValues[name] ?? false as T[keyof T];
      }
    } else {
      data[name] = null;
    }
  }
  return data;
}

export function getFieldLabel(field: FormFieldDef) {
  if (field.required && field.type !== "boolean") {
    return `${field.display_name} *`;
  }
  return field.display_name;
}
